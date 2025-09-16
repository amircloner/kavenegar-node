"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KavenegarApi = void 0;
exports.KavenegarApiFactory = KavenegarApiFactory;
const https_1 = __importDefault(require("https"));
const querystring_1 = __importDefault(require("querystring"));
class KavenegarApi {
    constructor(options) {
        if (!options || !options.apikey) {
            throw new Error('apikey is required');
        }
        this.host = options.host || 'api.kavenegar.com';
        this.version = options.version || 'v1';
        this.apikey = options.apikey;
    }
    /**
     * Normalize status params: accepts single id, comma separated string, or array of ids (string|number).
     * Ensures the selected key (messageid/localid) is converted to a comma separated string.
     * Enforces the documented limit of maximum 500 ids per request.
     */
    normalizeStatusParams(params, key) {
        const value = params[key];
        if (typeof value === 'undefined' || value === null)
            return params;
        let ids; // working list
        if (Array.isArray(value)) {
            ids = value;
        }
        else if (typeof value === 'string') {
            // Allow user-provided comma separated string (trim spaces)
            ids = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        }
        else {
            ids = [value];
        }
        if (ids.length > 500) {
            throw new Error('Status request exceeds 500 ids limit');
        }
        // Rebuild as comma separated string (numbers remain as-is, ensure no extraneous spaces)
        const joined = ids.join(',');
        return { ...params, [key]: joined };
    }
    request(action, method, params, callback) {
        return new Promise((resolve, reject) => {
            const path = `/${this.version}/${this.apikey}/${action}/${method}.json`;
            const postdata = querystring_1.default.stringify(params);
            const postOptions = {
                host: this.host,
                port: 443,
                path,
                method: 'POST',
                headers: {
                    'Content-Length': Buffer.byteLength(postdata),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            };
            const req = https_1.default.request(postOptions, res => {
                res.setEncoding('utf8');
                let result = '';
                res.on('data', chunk => (result += chunk));
                res.on('end', () => {
                    try {
                        const jsonObject = JSON.parse(result);
                        if (callback) {
                            callback(jsonObject.entries, jsonObject.return.status, jsonObject.return.message);
                        }
                        resolve(jsonObject);
                    }
                    catch (err) {
                        if (callback) {
                            callback(undefined, 500, err === null || err === void 0 ? void 0 : err.message);
                        }
                        reject(err);
                    }
                });
            });
            req.write(postdata, 'utf8');
            req.on('error', e => {
                if (callback)
                    callback(undefined, 500, e.message);
                reject(e);
            });
            req.end();
        });
    }
    // API Methods
    Send(params, cb) {
        return this.request('sms', 'send', params, cb);
    }
    /**
     * Send multiple distinct messages from potentially different senders to different receptors.
     * All array fields (receptor, sender, message) MUST have the same length. Optional parallel arrays (type, localmessageids) must match if provided.
     * This helper accepts plain arrays and internally converts them to JSON array string values as accepted by the REST API.
     * Errors (client-side) thrown BEFORE request:
     *  - LengthMismatch: when mandatory arrays differ in size
     *  - OptionalLengthMismatch: when optional arrays provided but size differs
     */
    SendArray(params, cb) {
        const { receptor, sender, message } = params;
        if (!Array.isArray(receptor) || !Array.isArray(sender) || !Array.isArray(message)) {
            throw new Error('receptor, sender and message must be arrays');
        }
        const n = receptor.length;
        if (!(sender.length === n && message.length === n)) {
            throw new Error('LengthMismatch: receptor, sender and message arrays must be equal size');
        }
        const { type, localmessageids } = params;
        // Convert arrays to JSON string expected by API (doc sample uses JSON arrays)
        const payload = {
            receptor: JSON.stringify(receptor),
            sender: JSON.stringify(sender),
            message: JSON.stringify(message)
        };
        if (params.date)
            payload.date = params.date;
        if (params.tag)
            payload.tag = params.tag;
        if (typeof params.hide !== 'undefined')
            payload.hide = params.hide ? 1 : 0;
        if (type)
            payload.type = JSON.stringify(type);
        if (localmessageids)
            payload.localmessageids = JSON.stringify(localmessageids);
        return this.request('sms', 'sendarray', payload, cb);
    }
    Status(params, cb) {
        const normalized = this.normalizeStatusParams(params, 'messageid');
        return this.request('sms', 'status', normalized, cb);
    }
    /**
     * Fetch delivery status list using previously supplied localid values instead of messageid.
     * Usage scenarios:
     *  - When your data model cannot persist the service generated messageid
     *  - When you prefer to correlate by your own local identifiers
     * Input forms accepted (same flexibility as Status):
     *  - { localid: 'loc1,loc2,loc3' }
     *  - { localid: ['loc1','loc2'] }
     *  - { localid: 12345 } (numeric id)
     * Constraints / Notes (per official docs):
     *  - Maximum 500 local ids per request (library enforces – throws before network if exceeded)
     *  - Only messages of last 12 hours are queryable by localid (older => status may be 100 invalid)
     *  - If a provided localid was NOT sent (or you never passed a localid when sending) returned status = 100 (invalid)
     *  - Response structure equals Status: array of { messageid, localid?, status, statustext }
     *  - Server error 414 when more than allowed ids are submitted (defensively prevented here)
     */
    StatusLocalMessageid(params, cb) {
        const normalized = this.normalizeStatusParams(params, 'localid');
        return this.request('sms', 'statuslocalmessageid', normalized, cb);
    }
    /**
     * Retrieve detailed information for one or more previously sent messages by messageid.
     * Persian Doc Summary (انتخاب پیامک / select):
     *  - Input: messageid (الزامی) up to 500 ids. Accepts single id, comma separated list, or array.
     *  - Output: entries[] each containing: messageid, message, status, statustext, sender, receptor, date (UnixTime), cost (rial)
     *  - Differences vs Status: richer payload (text, sender, receptor, cost, date). For frequent polling prefer Status for speed/lower payload.
     *  - Invalid or not-owned ids return status=100 inside their entry (NOT an HTTP error).
     *  - Server Errors:
     *      400 => missing/invalid parameters
     *      407 => access to requested data denied (e.g., not your message)
     *      414 => too many ids (>500) – library guards earlier
     *  - Security: Requires configured IP in panel (per docs) else 407.
     */
    Select(params, cb) {
        if (!params || typeof params.messageid === 'undefined' || params.messageid === null) {
            throw new Error('messageid is required');
        }
        const normalized = this.normalizeStatusParams(params, 'messageid');
        return this.request('sms', 'select', normalized, cb);
    }
    /**
     * Retrieve list of sent messages (outbox) within a time window.
     * Validation enforced client-side according to Persian documentation (لیست ارسال ها):
     *  - startdate: required (UnixTime seconds). Must not be older than 4 days from now.
     *  - enddate: optional. If provided must be >= startdate.
     *  - Max allowed span between startdate and enddate: 1 day (86400 seconds).
     *  - To fetch from startdate until now, omit enddate.
     *  - Optional sender to restrict to a specific dedicated line.
     * Errors thrown before network call when constraints violated.
     */
    SelectOutbox(params, cb) {
        if (!params || typeof params.startdate !== 'number' || !Number.isFinite(params.startdate)) {
            throw new Error('startdate (unix seconds) is required');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const FOUR_DAYS = 4 * 86400; // 345600 seconds
        const ONE_DAY = 86400;
        if (nowSec - params.startdate > FOUR_DAYS) {
            throw new Error('startdate cannot be older than 4 days');
        }
        if (params.enddate !== undefined) {
            if (typeof params.enddate !== 'number' || !Number.isFinite(params.enddate)) {
                throw new Error('enddate must be a unix seconds number');
            }
            if (params.enddate < params.startdate) {
                throw new Error('enddate cannot be less than startdate');
            }
            if (params.enddate - params.startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        // Pass through directly (server enforces record limit of 500)
        return this.request('sms', 'selectoutbox', params, cb);
    }
    LatestOutbox(params, cb) {
        // Provide strongly typed + validated version (backward compatible with loose call sites)
        const p = { ...params };
        if (typeof p.pagesize === 'undefined' || p.pagesize === null) {
            p.pagesize = 500; // explicit default so behavior is predictable
        }
        else {
            if (typeof p.pagesize !== 'number' || !Number.isFinite(p.pagesize)) {
                throw new Error('pagesize must be a number');
            }
            if (p.pagesize < 1 || p.pagesize > 500) {
                throw new Error('pagesize must be between 1 and 500');
            }
        }
        return this.request('sms', 'latestoutbox', p, cb);
    }
    /**
     * CountOutbox - تعداد ارسال ها
     * Returns aggregate counts (sumpart, sumcount, cost) for sent SMS in a time window.
     * Client-side validation according to provided Persian docs:
     *  - startdate: required, unix seconds, not older than 4 days.
     *  - enddate: optional; if omitted server treats it as now. If provided must be >= startdate.
     *  - Max span between startdate and enddate is 1 day (86400 seconds). (If enddate omitted we allow skip check; server enforces now-start <= 1 day anyway. For consistency we compute a virtual now end.)
     *  - status: optional numeric delivery status code to filter counts; if provided must be finite number.
     * Throws Error BEFORE network if constraints violated.
     */
    CountOutbox(params, cb) {
        if (!params || typeof params.startdate !== 'number' || !Number.isFinite(params.startdate)) {
            throw new Error('startdate (unix seconds) is required');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const FOUR_DAYS = 4 * 86400;
        const ONE_DAY = 86400;
        if (nowSec - params.startdate > FOUR_DAYS) {
            throw new Error('startdate cannot be older than 4 days');
        }
        let end = params.enddate;
        if (end !== undefined) {
            if (typeof end !== 'number' || !Number.isFinite(end)) {
                throw new Error('enddate must be a unix seconds number');
            }
            if (end < params.startdate) {
                throw new Error('enddate cannot be less than startdate');
            }
            if (end - params.startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        else {
            // If omitted treat as now for local validation of span
            end = nowSec;
            if (end - params.startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        if (params.status !== undefined) {
            if (typeof params.status !== 'number' || !Number.isFinite(params.status)) {
                throw new Error('status must be a number');
            }
        }
        // Build payload (do not send computed end if user omitted it; let server treat as now)
        const payload = { startdate: params.startdate };
        if (params.enddate !== undefined)
            payload.enddate = params.enddate;
        if (params.status !== undefined)
            payload.status = params.status;
        return this.request('sms', 'countoutbox', payload, cb);
    }
    Cancel(params, cb) {
        return this.request('sms', 'cancel', params, cb);
    }
    Receive(params, cb) {
        if (!params)
            throw new Error('params required');
        // Backward compatibility: allow `line` alias
        const linenumber = params.linenumber || params.line;
        if (!linenumber) {
            throw new Error('linenumber is required');
        }
        if (typeof linenumber !== 'string' || !linenumber.trim()) {
            throw new Error('linenumber must be a non-empty string');
        }
        if (typeof params.isread === 'undefined' || params.isread === null) {
            throw new Error('isread is required (0 for unread, 1 for read)');
        }
        let isread;
        if (typeof params.isread === 'boolean') {
            isread = params.isread ? 1 : 0;
        }
        else if (params.isread === 0 || params.isread === 1) {
            isread = params.isread;
        }
        else {
            throw new Error('isread must be 0, 1, false, or true');
        }
        const payload = { linenumber, isread };
        // Pass through optional date filters if user supplied (not in new snippet but kept for compatibility)
        if (typeof params.fromdate === 'number')
            payload.fromdate = params.fromdate;
        if (typeof params.todate === 'number')
            payload.todate = params.todate;
        return this.request('sms', 'receive', payload, cb);
    }
    /**
     * Paged inbox retrieval (inboxpaged)
     * Persian docs (provided snippet):
     *  - linenumber (required) شماره خط
     *  - isread (required) 0=خوانده نشده, 1=خوانده شده
     *  - startdate (optional) UnixTime
     *  - enddate (optional) UnixTime
     *  - pagenumber (optional) صفحه (1-based). If omitted defaults to page 1 (server default).
     * Returns up to 200 entries per page with metadata { totalcount, currentpage, totalpages, pagesize }.
     * Notes:
     *  - totalcount semantic differs for unread mode (isread=0) vs read (isread=1) per doc.
     *  - Max 2-day span between startdate and enddate; enddate cannot be less than startdate; if dates omitted defaults to last 2 days.
     *  - Library performs lightweight validation; detailed constraints left to server if ambiguous.
     */
    InboxPaged(params, cb) {
        if (!params)
            throw new Error('params required');
        const { linenumber } = params;
        if (!linenumber || typeof linenumber !== 'string' || !linenumber.trim()) {
            throw new Error('linenumber is required and must be non-empty string');
        }
        if (typeof params.isread === 'undefined' || params.isread === null) {
            throw new Error('isread is required (0 for unread, 1 for read)');
        }
        let isread;
        if (typeof params.isread === 'boolean') {
            isread = params.isread ? 1 : 0;
        }
        else if (params.isread === 0 || params.isread === 1) {
            isread = params.isread;
        }
        else {
            throw new Error('isread must be 0, 1, false or true');
        }
        const payload = { linenumber, isread };
        if (typeof params.startdate === 'number')
            payload.startdate = params.startdate;
        if (typeof params.enddate === 'number') {
            if (typeof params.startdate === 'number' && params.enddate < params.startdate) {
                throw new Error('enddate cannot be less than startdate');
            }
            payload.enddate = params.enddate;
            if (typeof params.startdate === 'number') {
                const span = params.enddate - params.startdate;
                const TWO_DAYS = 2 * 86400; // per doc
                if (span > TWO_DAYS) {
                    throw new Error('Maximum allowed range between startdate and enddate is 2 days');
                }
            }
        }
        if (typeof params.pagenumber === 'number') {
            if (!Number.isInteger(params.pagenumber) || params.pagenumber < 1) {
                throw new Error('pagenumber must be a positive integer (1-based)');
            }
            payload.pagenumber = params.pagenumber;
        }
        return this.request('sms', 'inboxpaged', payload, cb);
    }
    /**
     * CountInbox - تعداد پیامک های دریافت شده
     * Returns aggregate number of received (inbox) messages over a time window.
     * Client-side validation based on Persian documentation.
     * Validations:
     *  - startdate: required, unix seconds, not older than 60 days from now.
     *  - enddate: optional; if provided must be >= startdate and within 1 day span.
     *  - If enddate omitted we treat effective end as now and enforce (now - startdate) <= 86400.
     *  - linenumber: optional non-empty string.
     *  - isread: optional; accepts 0/1 or boolean. Converted to 0/1 if provided.
     * Throws Error before network if constraints violated for consistency with other methods.
     */
    CountInbox(params, cb) {
        if (!params || typeof params.startdate !== 'number' || !Number.isFinite(params.startdate)) {
            throw new Error('startdate (unix seconds) is required');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const SIXTY_DAYS = 60 * 86400; // 5184000 seconds
        const ONE_DAY = 86400;
        if (nowSec - params.startdate > SIXTY_DAYS) {
            throw new Error('startdate cannot be older than 60 days');
        }
        let end = params.enddate;
        if (end !== undefined) {
            if (typeof end !== 'number' || !Number.isFinite(end)) {
                throw new Error('enddate must be a unix seconds number');
            }
            if (end < params.startdate) {
                throw new Error('enddate cannot be less than startdate');
            }
            if (end - params.startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        else {
            end = nowSec;
            if (end - params.startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        let isread;
        if (params.isread !== undefined) {
            if (typeof params.isread === 'boolean') {
                isread = params.isread ? 1 : 0;
            }
            else if (params.isread === 0 || params.isread === 1) {
                isread = params.isread;
            }
            else {
                throw new Error('isread must be 0, 1, false or true when provided');
            }
        }
        if (params.linenumber !== undefined) {
            if (typeof params.linenumber !== 'string' || !params.linenumber.trim()) {
                throw new Error('linenumber must be a non-empty string when provided');
            }
        }
        // Build payload (omit synthetic enddate if user omitted it so server uses its own "now")
        const payload = { startdate: params.startdate };
        if (params.enddate !== undefined)
            payload.enddate = params.enddate;
        if (params.linenumber !== undefined)
            payload.linenumber = params.linenumber;
        if (isread !== undefined)
            payload.isread = isread;
        return this.request('sms', 'countinbox', payload, cb);
    }
    CountPostalCode(params, cb) {
        return this.request('sms', 'countpostalcode', params, cb);
    }
    SendByPostalCode(params, cb) {
        return this.request('sms', 'sendbypostalcode', params, cb);
    }
    /**
     * High-priority verification message sender (Verify Lookup)
     * Only needs receptor + template + at least token.
     * Server chooses best sender number automatically.
     */
    VerifyLookup(params, cb) {
        return this.request('verify', 'lookup', params, cb);
    }
    AccountInfo(params, cb) {
        // Endpoint does not require parameters; allow passing empty object or omitted.
        const payload = params || {};
        return this.request('account', 'info', payload, cb);
    }
    AccountConfig(params, cb) {
        /**
         * AccountConfig - تنظیمات ضروری حساب
         * English:
         *  Retrieve or modify account configuration settings. Calling without any parameters returns the current values.
         *  Passing one or more parameters updates them and returns the new snapshot in entries.
         * Persian Summary:
         *  این متد برای دریافت یا ویرایش تنظیمات حساب است. در صورت عدم ارسال هیچ پارامتری مقادیر فعلی بازگردانده می شود.
         *  با ارسال هر پارامتر مقدار جدید ذخیره و مقادیر بروز برگردانده می شود.
         *
         * Parameters:
         *  - apilogs: justfaults | enabled | disabled (همه درخواست ها / فقط خطاها / غیرفعال). Boolean/0/1 also accepted.
         *  - dailyreport: enabled | disabled (گزارش روزانه پیامک ساعت ۱۰ صبح). Boolean/0/1 accepted.
         *  - debugmode: enabled | disabled (در حالت فعال، ارسال پیامک انجام نمی شود). Boolean/0/1 accepted.
         *  - defaultsender: خط پیش فرض ارسال (در صورت عدم تعیین sender در ارسال پیام).
         *  - mincreditalarm: حداقل اعتبار (ریال) برای هشدار کمبود اعتبار (عدد صحیح غیر منفی).
         *  - resendfailed: enabled | disabled (ارسال مجدد خودکار پیامک های نرسیده). Boolean/0/1 accepted. NOTE: API sample shows true/false strings in response.
         *
         * Normalization Rules:
         *  - Boolean true/1 -> enabled (or 'true' for resendfailed) ; false/0 -> disabled (or 'false').
         *  - apilogs also accepts 'justfaults'.
         *  - Throws descriptive Error for invalid values before network call.
         *
         * Example (update multiple):
         *  api.AccountConfig({ defaultsender: '10004535', apilogs: 'justfaults', debugmode: true })
         *    .then(r => console.log(r.entries));
         *
         * Example (fetch current):
         *  api.AccountConfig({}).then(r => console.log(r.entries));
         */
        // Build validated & normalized payload according to docs.
        const normalizeToggle = (value, { allowJustFaults = false, resendMode = false } = {}) => {
            if (value === undefined || value === null)
                return undefined;
            if (typeof value === 'string') {
                const v = value.toLowerCase();
                if (allowJustFaults && ['justfaults', 'enabled', 'disabled'].includes(v))
                    return v;
                if (!allowJustFaults && ['enabled', 'disabled'].includes(v))
                    return v;
                // Some users may try 'true'/'false' textual
                if (['true', 'false'].includes(v) && resendMode)
                    return v; // for resendfailed returning true/false style
                if (['true', 'false'].includes(v))
                    return v === 'true' ? 'enabled' : 'disabled';
                throw new Error(`Invalid string value '${value}'`);
            }
            if (typeof value === 'boolean')
                return value ? (resendMode ? 'true' : 'enabled') : (resendMode ? 'false' : 'disabled');
            if (value === 1)
                return resendMode ? 'true' : 'enabled';
            if (value === 0)
                return resendMode ? 'false' : 'disabled';
            throw new Error('Invalid toggle value (expected string|boolean|0|1)');
        };
        const payload = {};
        if ('apilogs' in params && params.apilogs !== undefined) {
            payload.apilogs = normalizeToggle(params.apilogs, { allowJustFaults: true });
        }
        if ('dailyreport' in params && params.dailyreport !== undefined) {
            payload.dailyreport = normalizeToggle(params.dailyreport);
        }
        if ('debugmode' in params && params.debugmode !== undefined) {
            payload.debugmode = normalizeToggle(params.debugmode);
        }
        if ('resendfailed' in params && params.resendfailed !== undefined) {
            // API documentation shows enabled/disabled, but sample output shows true/false; choose output form expected by server: use true/false strings.
            payload.resendfailed = normalizeToggle(params.resendfailed, { resendMode: true });
        }
        if (params.defaultsender !== undefined) {
            if (typeof params.defaultsender !== 'string' || !params.defaultsender.trim()) {
                throw new Error('defaultsender must be a non-empty string when provided');
            }
            payload.defaultsender = params.defaultsender.trim();
        }
        if (params.mincreditalarm !== undefined) {
            if (typeof params.mincreditalarm !== 'number' || !Number.isFinite(params.mincreditalarm) || params.mincreditalarm < 0) {
                throw new Error('mincreditalarm must be a non-negative number');
            }
            if (!Number.isInteger(params.mincreditalarm)) {
                throw new Error('mincreditalarm must be an integer rial amount');
            }
            payload.mincreditalarm = params.mincreditalarm;
        }
        return this.request('account', 'config', payload, cb);
    }
    CallMakeTTS(params, cb) {
        // Validation per voice call doc
        if (!params || typeof params.receptor !== 'string' || !params.receptor.trim()) {
            throw new Error('receptor is required (comma separated string)');
        }
        if (!params.message || typeof params.message !== 'string') {
            throw new Error('message is required');
        }
        // Normalize receptor list
        const receptors = params.receptor.split(',').map(r => r.trim()).filter(r => r.length > 0);
        if (receptors.length === 0) {
            throw new Error('At least one receptor required');
        }
        if (receptors.length > 200) {
            throw new Error('Maximum 200 receptors allowed (414)');
        }
        // localid matching (if provided and contains commas OR multiple receptors)
        let localid = params.localid;
        if (localid) {
            const localIds = localid.split(',').map(x => x.trim()).filter(x => x.length > 0);
            if (localIds.length !== 1 && localIds.length !== receptors.length) {
                throw new Error('localid count must equal receptor count or be a single id');
            }
            // If single id and multiple receptors, server behavior: prevent duplicate? We'll send as is.
            localid = localIds.join(',');
        }
        // repeat range 0..5
        if (typeof params.repeat !== 'undefined') {
            if (typeof params.repeat !== 'number' || !Number.isInteger(params.repeat) || params.repeat < 0 || params.repeat > 5) {
                throw new Error('repeat must be integer between 0 and 5');
            }
        }
        // date (must be unix seconds & not in the past if provided)
        if (typeof params.date !== 'undefined') {
            if (typeof params.date !== 'number' || !Number.isFinite(params.date)) {
                throw new Error('date must be a unix seconds number');
            }
            const nowSec = Math.floor(Date.now() / 1000);
            if (params.date < nowSec) {
                throw new Error('date (schedule) cannot be in the past');
            }
        }
        // tag validation (reuse SMS tag rules)
        if (params.tag !== undefined) {
            const tagPattern = /^[A-Za-z0-9_-]{1,200}$/;
            if (!tagPattern.test(params.tag)) {
                throw new Error('tag must match pattern ^[A-Za-z0-9_-]{1,200}$');
            }
        }
        const payload = {
            receptor: receptors.join(','),
            message: params.message
        };
        if (typeof params.date === 'number')
            payload.date = params.date;
        if (localid)
            payload.localid = localid;
        if (typeof params.repeat === 'number')
            payload.repeat = params.repeat;
        if (params.tag)
            payload.tag = params.tag;
        return this.request('call', 'maketts', payload, cb);
    }
    /**
     * Fetch delivery status list for all messages sent TO a specific receptor (mobile number) within a time window.
     * Persian Doc Summary (وضعیت پیام بر اساس شماره گیرنده):
     *  - receptor (اجباری): شماره گیرنده
     *  - startdate (اجباری – UnixTime seconds)
     *  - enddate (اختیاری – UnixTime seconds)
     * Notes / Validation enforced client-side:
     *  - If enddate omitted => server considers one day window (startdate .. startdate + 86400)
     *  - If enddate provided it MUST be >= startdate
     *  - Max span between startdate and enddate is 1 day (86400 seconds)
     *  - All times assumed to be in seconds (UNIX epoch). Library does not auto-convert ms.
     * Failure cases: throws Error with descriptive message before network call.
     */
    StatusByReceptor(params, cb) {
        if (!params || !params.receptor) {
            throw new Error('receptor is required');
        }
        if (typeof params.startdate !== 'number' || !Number.isFinite(params.startdate)) {
            throw new Error('startdate (unix seconds) is required');
        }
        const ONE_DAY = 86400; // seconds
        let { startdate, enddate } = params;
        if (enddate !== undefined) {
            if (typeof enddate !== 'number' || !Number.isFinite(enddate)) {
                throw new Error('enddate must be a unix seconds number');
            }
            if (enddate < startdate) {
                throw new Error('enddate cannot be less than startdate');
            }
            if (enddate - startdate > ONE_DAY) {
                throw new Error('Maximum allowed range is 1 day (86400 seconds)');
            }
        }
        // If enddate omitted we simply omit; server will assume one day window.
        const payload = { receptor: params.receptor, startdate };
        if (enddate !== undefined)
            payload.enddate = enddate;
        return this.request('sms', 'statusbyreceptor', payload, cb);
    }
    /**
     * List blocked numbers for a specific dedicated line (Line/blocked/list).
     * Persian Doc Summary (شماره های مسدود شده):
     *  - linenumber (required) شماره خط
     *  - blockreason (optional) فیلتر دلیل: 0 وب سرویس,1 پنل کاربری,2 لغو ۱۱,3 ادمین,10 نامشخص
     *  - startdate (optional) UnixTime شروع بازه؛ اگر خالی باشد روز جاری در نظر گرفته می شود.
     *  - pagenumber (optional) شماره صفحه (۱ مبنا). هر فراخوانی حداکثر 200 شماره.
     * Response shape: { return, entries: [{ number, blockreason, date }], metadata: { totalcount, currentpage, totalpages, pagesize } }
     * Notes:
     *  - Iterate while currentpage < totalpages for complete list.
     *  - Library performs minimal validation (linenumber non-empty string, positive integer page, blockreason numeric if provided).
     */
    LineBlockedList(params, cb) {
        if (!params || typeof params.linenumber !== 'string' || !params.linenumber.trim()) {
            throw new Error('linenumber is required and must be non-empty string');
        }
        const payload = { linenumber: params.linenumber };
        if (params.blockreason !== undefined) {
            if (typeof params.blockreason !== 'number' || !Number.isFinite(params.blockreason)) {
                throw new Error('blockreason must be a number when provided');
            }
            payload.blockreason = params.blockreason;
        }
        if (params.startdate !== undefined) {
            if (typeof params.startdate !== 'number' || !Number.isFinite(params.startdate)) {
                throw new Error('startdate must be a unix time number when provided');
            }
            payload.startdate = params.startdate;
        }
        if (params.pagenumber !== undefined) {
            if (!Number.isInteger(params.pagenumber) || params.pagenumber < 1) {
                throw new Error('pagenumber must be a positive integer (1-based)');
            }
            payload.pagenumber = params.pagenumber;
        }
        return this.request('Line/blocked', 'list', payload, cb);
    }
}
exports.KavenegarApi = KavenegarApi;
// Factory function with backward-compatible CommonJS style
function KavenegarApiFactory(options) {
    return new KavenegarApi(options);
}
// Default export for modern usage
exports.default = KavenegarApi;
