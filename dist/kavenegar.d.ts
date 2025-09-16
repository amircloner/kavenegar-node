export interface KavenegarReturnStatus {
    status: number;
    message: string;
}
export interface KavenegarApiResponse<TEntry = any, TMeta = any> {
    entries: TEntry;
    return: KavenegarReturnStatus;
    /** Optional metadata block (paging, counts, etc.) – present on some endpoints like inboxpaged */
    metadata?: TMeta;
}
export type KavenegarCallback<T = any> = (entries: T | undefined, status: number, message?: string) => void;
export interface KavenegarClientOptions {
    apikey: string;
    host?: string;
    version?: string;
}
export interface SendParams {
    receptor: string;
    message: string;
    sender?: string;
    date?: number;
    localid?: string | string[];
    /**
     * Message type in handset (only applicable to 3000 lines per docs). Kept loose because API accepts numeric or textual codes.
     */
    type?: string | number;
    /**
     * If 1 (or true) receptor number will be hidden in panel/web logs.
     * Accept both boolean and numeric for convenience.
     */
    hide?: boolean | 0 | 1;
    /**
     * Optional analytics tag (max 200 chars, english letters/digits, dash - or underscore _ only, no spaces or special chars)
     */
    tag?: string;
}
/**
 * Parameters for bulk (array) send (sendarray)
 * According to FA docs: all array fields must have identical lengths and the request MUST be POST.
 * The REST endpoint expects JSON array strings (e.g. '["09..","09.."]') OR standard form arrays (we send JSON string for clarity/compatibility).
 */
export interface SendArrayParams {
    receptor: string[];
    sender: string[];
    message: string[];
    date?: number;
    type?: Array<number | string>;
    localmessageids?: Array<string | number>;
    hide?: 0 | 1 | boolean;
    tag?: string;
    [extra: string]: any;
}
export interface StatusParams {
    messageid?: string | number | Array<string | number>;
    localid?: string | number | Array<string | number>;
}
export interface StatusEntry {
    messageid: number;
    status: number;
    statustext: string;
    [extra: string]: any;
}
export interface SelectParams {
    messageid: string | number | Array<string | number>;
}
export interface SelectEntry {
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
    [extra: string]: any;
}
/**
 * Parameters for LatestOutbox (آخرین ارسال ها)
 * Persian Doc Summary:
 *  - pagesize (اختیاری): تعداد آخرین رکوردها (حداکثر 500) – اگر ارسال نشود 500 در نظر گرفته می‌شود
 *  - sender (اختیاری): محدود کردن به یک خط اختصاصی مشخص
 * Notes:
 *  - No pagination yet (future per docs)
 *  - Security: Requires whitelisted IP else 407
 *  - Server errors (per doc excerpt):
 *      400 => invalid params (e.g. pagesize > 500 treated as missing / invalid)
 *      407 => access denied (IP not set / not allowed)
 *      412 => invalid sender (not owned by account)
 * Client side validation implemented:
 *  - pagesize if provided must be finite number between 1 and 500 inclusive.
 *  - If omitted we will send pagesize=500 explicitly so user code gets consistent results.
 */
export interface LatestOutboxParams {
    pagesize?: number;
    sender?: string;
    [extra: string]: any;
}
export interface LatestOutboxEntry extends SelectEntry {
}
export interface ReceiveParams {
    /** Dedicated line number (e.g., 30002225). Required in new API spec. */
    linenumber?: string;
    /** Message read flag: 0 unread, 1 read. Accepts boolean for convenience. Required. */
    isread?: number | boolean;
    /** Optional start unix time (seconds) – not in provided doc but kept for backward compatibility */
    fromdate?: number;
    /** Optional end unix time (seconds) */
    todate?: number;
    /** Backward compatibility alias – will be mapped to linenumber if provided. */
    line?: string;
}
export interface ReceiveEntry {
    messageid: number;
    message: string;
    sender: string;
    receptor: string;
    date: number;
    [extra: string]: any;
}
export interface InboxPagedParams {
    linenumber: string;
    isread: 0 | 1 | boolean;
    startdate?: number;
    enddate?: number;
    pagenumber?: number;
}
export interface InboxPagedMetadata {
    totalcount: string;
    currentpage: string;
    totalpages: string;
    pagesize: string;
    [extra: string]: any;
}
export interface InboxPagedResponse extends KavenegarApiResponse<ReceiveEntry[], InboxPagedMetadata> {
}
/**
 * Parameters for fetching blocked numbers for a dedicated line.
 * Persian Doc Summary (شماره های مسدود شده):
 *  - linenumber (اجباری) String: شماره خط (نمونه 30002225)
 *  - blockreason (اختیاری) Integer: فیلتر دلیل مسدودسازی
 *      0 = وب سرویس, 1 = پنل کاربری, 2 = لغو 11, 3 = ادمین, 10 = نامشخص (اگر ارسال نشود همه نمایش داده می شوند)
 *  - startdate (اختیاری) UnixTime Long: تاریخ شروع بازه (اگر خالی باشد تاریخ همان روز لحاظ می شود توسط سرویس)
 *  - pagenumber (اختیاری) Integer: شماره صفحه (۱ مبنا)؛ هر صفحه حداکثر 200 شماره برمی گرداند.
 * Notes:
 *  - Response includes metadata with paging info identical key naming: totalcount, currentpage, totalpages, pagesize
 *  - Keep optional params undefined if user did not provide (server default logic applies)
 */
export interface LineBlockedListParams {
    linenumber: string;
    blockreason?: number;
    startdate?: number;
    pagenumber?: number;
    [extra: string]: any;
}
/**
 * Single entry for blocked numbers list.
 * number: شماره فرد مسدود کننده
 * blockreason: دلیل (numeric code)
 * date: UnixTime تاریخ دریافت پیامک (زمان ثبت مسدودسازی)
 */
export interface LineBlockedNumberEntry {
    number: string;
    blockreason: number;
    date: number;
    [extra: string]: any;
}
export interface LineBlockedListMetadata {
    totalcount: string;
    currentpage: string;
    totalpages: string;
    pagesize: string;
    [extra: string]: any;
}
export interface LineBlockedListResponse extends KavenegarApiResponse<LineBlockedNumberEntry[], LineBlockedListMetadata> {
}
export interface StatusByReceptorParams {
    receptor: string;
    startdate: number;
    enddate?: number;
}
export interface StatusByReceptorEntry {
    messageid: number;
    receptor: string;
    status: number;
    statustext: string;
    [extra: string]: any;
}
/**
 * Parameters for SelectOutbox (لیست ارسال ها)
 * Fetch list of sent messages (outbox) in a given time window.
 * Persian Doc Highlights:
 *  - startdate (اجباری) UnixTime seconds
 *  - enddate (اختیاری) UnixTime seconds
 *  - sender (اختیاری) شماره خط اختصاصی
 * Constraints / Notes:
 *  - startdate must NOT be more than 4 days (345600 seconds) in the past relative to 'now'.
 *  - If enddate provided: MUST be >= startdate.
 *  - Max span (enddate - startdate) <= 1 day (86400 seconds).
 *  - If enddate omitted server returns messages from startdate up to now (bounded by internal 1 day / 500 records limit as per docs).
 *  - Max 500 records returned (server side limit; no pagination yet).
 */
export interface SelectOutboxParams {
    startdate: number;
    enddate?: number;
    sender?: string;
    [extra: string]: any;
}
/**
 * Parameters for CountOutbox (تعداد ارسال ها)
 * Persian Doc Summary:
 *  - startdate (اجباری) UnixTime seconds: تاریخ شروع بازه
 *  - enddate (اختیاری) UnixTime seconds: تاریخ پایان بازه؛ اگر خالی باشد تا «اکنون» در نظر گرفته می شود
 *  - status (اختیاری) Integer: برای فیلتر تعداد پیامک ها با وضعیت خاص (مثلاً 1=در صف, 10=رسیده)
 * Output fields (entries[0]): startdate, enddate, sumpart, sumcount, cost
 * Constraints / Notes:
 *  - حداکثر فاصله زمانی بین startdate و enddate برابر با 1 روز (86400 ثانیه) است.
 *  - startdate حداکثر می تواند 4 روز قبل باشد (now - startdate <= 4*86400).
 *  - اگر enddate ارسال نشود تا زمان فعلی در نظر گرفته می شود.
 *  - enddate نباید از startdate کوچکتر باشد.
 *  - جهت دریافت تعداد پیامک های در صف کافیست status=1 ارسال شود.
 *  - خطا 417 در صورت تاریخ نامعتبر یا کوچک تر بودن enddate از startdate.
 */
export interface CountOutboxParams {
    startdate: number;
    enddate?: number;
    status?: number;
    [extra: string]: any;
}
/**
 * Response entry for CountOutbox.
 * sumpart * tariff = cost (per doc)
 */
export interface CountOutboxEntry {
    startdate: number;
    enddate: number;
    sumpart: number;
    sumcount: number;
    cost: number;
    [extra: string]: any;
}
/**
 * Parameters for CountInbox (تعداد پیامک های دریافت شده)
 * Persian Doc Summary:
 *  - startdate (اجباری) UnixTime seconds: تاریخ شروع بازه
 *  - enddate (اختیاری) UnixTime seconds: تاریخ پایان؛ اگر خالی باشد تا «هم اکنون» محاسبه می شود
 *  - linenumber (اختیاری) String: خط اختصاصی؛ در صورت عدم ارسال آمار همه خطوط برگردانده می شود
 *  - isread (اختیاری) Integer: 0 = خوانده نشده ها ، 1 = خوانده شده ها (اگر ارسال نشود همه پیامک ها لحاظ می شوند)
 * Output (entries[0]): { startdate, enddate, sumcount }
 * Constraints / Notes:
 *  - حداکثر فاصله زمانی بین startdate و enddate = 1 روز (86400 ثانیه).
 *  - startdate حداکثر تا 60 روز قبل مجاز است (60 * 86400 ثانیه).
 *  - enddate نباید از startdate کوچکتر باشد.
 *  - اگر enddate ارسال نشود و اختلاف اکنون با startdate > 1 روز باشد خطا برمی گردانیم (مگر اینکه سرویس رفتار متفاوتی اعمال کند؛ جهت سازگاری مشابه سایر متد ها محدود می کنیم).
 *  - برای دریافت فقط پیام های خوانده نشده: isread=0.
 * Failure / Server Errors:
 *  - 417 => تاریخ نامعتبر یا enddate < startdate
 */
export interface CountInboxParams {
    startdate: number;
    enddate?: number;
    linenumber?: string;
    isread?: number | boolean;
    [extra: string]: any;
}
export interface CountInboxEntry {
    startdate: number;
    enddate: number;
    sumcount: number;
    [extra: string]: any;
}
/**
 * Parameters for Verify Lookup (اعتبار سنجی)
 * Doc (FA) summary:
 *  - receptor (الزامی): شماره گیرنده. بین المللی با 00 + کد کشور
 *  - template (الزامی): نام الگوی تایید شده
 *  - token , token2 , token3 (string, no spaces) حداکثر 100 کاراکتر
 *  - token10 (up to 5 spaces allowed) حداکثر 100 کاراکتر
 *  - token20 (up to 8 spaces allowed) حداکثر 100 کاراکتر
 *  - type: 'sms' | 'call' (default sms). If token contains non-digit chars, call is not allowed
 *  - tag: optional analytic tag (only english letters/digits, dash - or underscore _ , max 200)
 */
export interface LookupParams {
    receptor: string;
    template: string;
    token?: string;
    token2?: string;
    token3?: string;
    token10?: string;
    token20?: string;
    /** @deprecated Not in current public docs; kept for backward compatibility */
    token30?: string;
    /** Message delivery type; 'sms' (default) or 'call' (voice). Library leaves validation to server. */
    type?: 'sms' | 'call' | string;
    /** Optional tag identifier defined in panel */
    tag?: string;
    /** Allow extra params forward compatible */
    [extra: string]: string | number | undefined;
}
/**
 * Parameters for account/config endpoint.
 * Doc (FA) summary:
 *  - apilogs: justfaults | enabled | disabled (supports boolean convenience => true=enabled, false=disabled, 1/0 likewise)
 *  - dailyreport: enabled | disabled (boolean/number convenience accepted)
 *  - debugmode: enabled | disabled (boolean/number convenience accepted)
 *  - defaultsender: dedicated line number to be used as fallback when sender omitted in send
 *  - mincreditalarm: integer rial threshold for low credit SMS alert
 *  - resendfailed: enabled | disabled (boolean/number convenience accepted)
 */
export interface AccountConfigParams {
    apilogs?: 'justfaults' | 'enabled' | 'disabled' | boolean | 0 | 1;
    dailyreport?: 'enabled' | 'disabled' | boolean | 0 | 1;
    debugmode?: 'enabled' | 'disabled' | boolean | 0 | 1;
    defaultsender?: string;
    mincreditalarm?: number;
    resendfailed?: 'enabled' | 'disabled' | boolean | 0 | 1;
    [extra: string]: any;
}
export interface PostalCodeParams {
    postalcode: string | number;
    sender?: string;
}
/**
 * Parameters for voice call (call/maketts) – تماس صوتی
 * Doc (FA) summary provided:
 *  - receptor (اجباری) String: یک یا چند شماره گیرنده جدا شده با ',' (حداکثر 200 شماره – خطای 414 در صورت بیشتر)
 *  - message (اجباری) String: متن تبدیل به گفتار (UTF-8 encoded). Caller should ensure proper URL encoding at transport layer (handled by querystring for POST here).
 *  - date (اختیاری) UnixTime: زمان ارسال آینده؛ اگر خالی باشد «اکنون».
 *  - localid (اختیاری) String: شناسه محلی؛ برای جلوگیری از ارسال تکراری. اگر چند receptor، باید به همان تعداد (comma separated) باشد.
 *  - repeat (اختیاری در حال حاضر غیر فعال per doc) int: تکرار 0..5 (فاصله 3 دقیقه). Library validates range if provided.
 *  - tag (اختیاری) String: نام تگ (200 chars, pattern ^[A-Za-z0-9_-]{1,200}$ ) must be pre-created.
 */
export interface CallMakeTTSParams {
    receptor: string;
    message: string;
    date?: number;
    localid?: string;
    repeat?: number;
    tag?: string;
}
/** Response entry for call/maketts (mirrors SMS select entry subset) */
export interface CallMakeTTSEntry {
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
    [extra: string]: any;
}
/**
 * Response entry shape for account/info endpoint.
 * remaincredit: اعتبار باقی مانده (ریال)
 * expiredate: UnixTime انقضاء (جنبه امنیتی؛ نگران انقضاء حساب نباشید)
 * type: نوع حساب (master | child)
 */
export interface AccountInfoEntry {
    remaincredit: number;
    expiredate: number;
    type: 'master' | 'child' | string;
    [extra: string]: any;
}
/**
 * Response entries for account/config.
 * All values returned as strings by API (per sample):
 *  apilogs: justfaults | enabled | disabled
 *  dailyreport: enabled | disabled
 *  debugmode: enabled | disabled
 *  defaultsender: sender line (string numeric)
 *  mincreditalarm: threshold (string numeric)
 *  resendfailed: true | false (NOTE: sample shows 'true'/'false' instead of enabled/disabled)
 */
export interface AccountConfigEntry {
    apilogs: string;
    dailyreport: string;
    debugmode: string;
    defaultsender: string;
    mincreditalarm: string;
    resendfailed: string;
    [extra: string]: any;
}
export type AnyParams = SendParams | StatusParams | ReceiveParams | LookupParams | AccountConfigParams | PostalCodeParams | CallMakeTTSParams | SelectOutboxParams | LatestOutboxParams | CountOutboxParams | LineBlockedListParams | CountInboxParams | Record<string, any>;
export declare class KavenegarApi {
    private host;
    private version;
    private apikey;
    constructor(options: KavenegarClientOptions);
    /**
     * Normalize status params: accepts single id, comma separated string, or array of ids (string|number).
     * Ensures the selected key (messageid/localid) is converted to a comma separated string.
     * Enforces the documented limit of maximum 500 ids per request.
     */
    private normalizeStatusParams;
    private request;
    Send(params: SendParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    /**
     * Send multiple distinct messages from potentially different senders to different receptors.
     * All array fields (receptor, sender, message) MUST have the same length. Optional parallel arrays (type, localmessageids) must match if provided.
     * This helper accepts plain arrays and internally converts them to JSON array string values as accepted by the REST API.
     * Errors (client-side) thrown BEFORE request:
     *  - LengthMismatch: when mandatory arrays differ in size
     *  - OptionalLengthMismatch: when optional arrays provided but size differs
     */
    SendArray(params: SendArrayParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    Status(params: StatusParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<StatusEntry[], any>>;
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
    StatusLocalMessageid(params: StatusParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<StatusEntry[], any>>;
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
    Select(params: SelectParams, cb?: KavenegarCallback<SelectEntry[]>): Promise<KavenegarApiResponse<SelectEntry[], any>>;
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
    SelectOutbox(params: SelectOutboxParams, cb?: KavenegarCallback<SelectEntry[]>): Promise<KavenegarApiResponse<SelectEntry[], any>>;
    LatestOutbox(params: Record<string, any>, cb?: KavenegarCallback): Promise<KavenegarApiResponse<LatestOutboxEntry[], any>>;
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
    CountOutbox(params: CountOutboxParams, cb?: KavenegarCallback<CountOutboxEntry[]>): Promise<KavenegarApiResponse<CountOutboxEntry[], any>>;
    Cancel(params: Record<string, any>, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    Receive(params: ReceiveParams, cb?: KavenegarCallback<ReceiveEntry[]>): Promise<KavenegarApiResponse<ReceiveEntry[], any>>;
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
    InboxPaged(params: InboxPagedParams, cb?: KavenegarCallback<ReceiveEntry[]>): Promise<KavenegarApiResponse<ReceiveEntry[], InboxPagedMetadata>>;
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
    CountInbox(params: CountInboxParams, cb?: KavenegarCallback<CountInboxEntry[]>): Promise<KavenegarApiResponse<CountInboxEntry[], any>>;
    CountPostalCode(params: PostalCodeParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    SendByPostalCode(params: PostalCodeParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    /**
     * High-priority verification message sender (Verify Lookup)
     * Only needs receptor + template + at least token.
     * Server chooses best sender number automatically.
     */
    VerifyLookup(params: LookupParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<any, any>>;
    AccountInfo(params: Record<string, any>, cb?: KavenegarCallback): Promise<KavenegarApiResponse<AccountInfoEntry, any>>;
    AccountConfig(params: AccountConfigParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<AccountConfigEntry, any>>;
    CallMakeTTS(params: CallMakeTTSParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<CallMakeTTSEntry, any>>;
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
    StatusByReceptor(params: StatusByReceptorParams, cb?: KavenegarCallback): Promise<KavenegarApiResponse<StatusByReceptorEntry[], any>>;
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
    LineBlockedList(params: LineBlockedListParams, cb?: KavenegarCallback<LineBlockedNumberEntry[]>): Promise<KavenegarApiResponse<LineBlockedNumberEntry[], LineBlockedListMetadata>>;
}
export declare function KavenegarApiFactory(options: KavenegarClientOptions): KavenegarApi;
export default KavenegarApi;
