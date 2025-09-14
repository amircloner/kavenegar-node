import https from 'https';
import querystring from 'querystring';

// Generic shape of API response from Kavenegar
export interface KavenegarReturnStatus {
  status: number; // e.g., 200 for success
  message: string;
}

export interface KavenegarApiResponse<TEntry = any, TMeta = any> {
  entries: TEntry;
  return: KavenegarReturnStatus;
  /** Optional metadata block (paging, counts, etc.) – present on some endpoints like inboxpaged */
  metadata?: TMeta;
}

// Callback signature used by library
export type KavenegarCallback<T = any> = (
  entries: T | undefined,
  status: number,
  message?: string
) => void;

export interface KavenegarClientOptions {
  apikey: string;
  host?: string; // default api.kavenegar.com
  version?: string; // default v1
}

// Common data shapes (kept liberal, can be tightened with real API docs)
export interface SendParams {
  receptor: string; // comma separated list of mobile numbers
  message: string;
  sender?: string;
  // Additional optional params
  date?: number; // Unix time schedule; if omitted sends immediately
  localid?: string | string[]; // single id OR list matching receptor count (comma separated if string)
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
  receptor: string[]; // Array of recipient numbers (size N)
  sender: string[]; // Array of sender lines (size N)
  message: string[]; // Array of messages (size N)
  date?: number; // Unix time schedule (applies to all messages) optional
  type?: Array<number | string>; // Message type array (only for 3000 lines) optional
  localmessageids?: Array<string | number>; // Local ids per message (size N) optional
  hide?: 0 | 1 | boolean; // If 1 hides receptors in panel
  tag?: string; // Optional analytics tag (must be pre-created in panel)
  // Allow forward compatibility with additional keys
  [extra: string]: any;
}

export interface StatusParams {
  messageid?: string | number | Array<string | number>;
  localid?: string | number | Array<string | number>;
}

// Response entry for status / statuslocalmessageid endpoints
export interface StatusEntry {
  messageid: number;
  status: number; // numeric delivery status code (see Kavenegar status table)
  statustext: string; // human readable (FA) description
  // Server may occasionally add more keys; keep index signature for forward compatibility
  [extra: string]: any;
}

// Parameters for detailed select (پیامک انتخاب) endpoint.
// messageid is REQUIRED and can be:
//  - single number or string
//  - array of numbers/strings (max 500)
//  - comma separated string of ids (library normalizes)
export interface SelectParams {
  messageid: string | number | Array<string | number>;
}

// Response entry for select endpoint (richer than StatusEntry)
export interface SelectEntry {
  messageid: number;
  message: string; // original sent text
  status: number; // numeric delivery status code
  statustext: string; // human readable localized status
  sender: string; // sender line
  receptor: string; // receptor number
  date: number; // Unix time (seconds) send date
  cost: number; // message billing cost (rial)
  [extra: string]: any; // forward compatibility
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

// Response entries of LatestOutbox share the same shape as SelectEntry.
export interface LatestOutboxEntry extends SelectEntry {}

// Parameters for Receive inbox messages
// Updated per latest Persian docs snippet provided:
//  - linenumber (اجباری) String: شماره خط (e.g. 30002225)
//  - isread (اجباری) Integer: 0 = unread, 1 = read
// Legacy support: previous version used `line` optional param. We'll map `line` -> `linenumber`.
export interface ReceiveParams {
  /** Dedicated line number (e.g., 30002225). Required in new API spec. */
  linenumber?: string; // keep optional at type level for backward compat; runtime will enforce.
  /** Message read flag: 0 unread, 1 read. Accepts boolean for convenience. Required. */
  isread?: number | boolean;
  /** Optional start unix time (seconds) – not in provided doc but kept for backward compatibility */
  fromdate?: number;
  /** Optional end unix time (seconds) */
  todate?: number;
  /** Backward compatibility alias – will be mapped to linenumber if provided. */
  line?: string;
}

// Response entry for Receive method
export interface ReceiveEntry {
  messageid: number; // شناسه پیام دریافتی
  message: string; // متن پیام
  sender: string; // شماره ارسال کننده
  receptor: string; // شماره دریافت کننده (your line)
  date: number; // UnixTime تاریخ دریافت
  [extra: string]: any; // forward compatibility
}

// Paged inbox (inboxpaged) parameters per provided Persian doc snippet
// Required: linenumber (String), isread (0/1), Optional: startdate, enddate, pagenumber
export interface InboxPagedParams {
  linenumber: string; // شماره خط
  isread: 0 | 1 | boolean; // خوانده نشده 0 ، خوانده شده 1 (boolean accepted for ergonomics)
  startdate?: number; // UnixTime seconds
  enddate?: number; // UnixTime seconds
  pagenumber?: number; // صفحه مورد نظر (1-based)
}

// Metadata returned by inboxpaged endpoint
export interface InboxPagedMetadata {
  totalcount: string; // تعداد کل پیام ها (یا تعداد باقی مانده بسته به isread per doc)
  currentpage: string; // صفحه فعلی
  totalpages: string; // تعداد کل صفحه ها
  pagesize: string; // تعداد پیام های هر صفحه (server fixed 200 per doc)
  [extra: string]: any;
}

export interface InboxPagedResponse extends KavenegarApiResponse<ReceiveEntry[], InboxPagedMetadata> {}

// ---------------- Line Blocked Numbers (لیست شماره های مسدود کننده خط) ----------------
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
  blockreason?: number; // 0,1,2,3,10 per doc
  startdate?: number; // Unix time seconds (LONG). If omitted server uses current day start.
  pagenumber?: number; // 1-based page number
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
  pagesize: string; // server fixed 200 per doc
  [extra: string]: any;
}

export interface LineBlockedListResponse extends KavenegarApiResponse<LineBlockedNumberEntry[], LineBlockedListMetadata> {}

// Parameters for status by receptor (statusbyreceptor)
export interface StatusByReceptorParams {
  receptor: string; // single receptor per docs (number/MSISDN)
  startdate: number; // required Unix time (seconds) start of range
  enddate?: number; // optional Unix time end of range
}

// Response entry for statusbyreceptor (subset of StatusEntry plus receptor)
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
  startdate: number; // required UnixTime (seconds)
  enddate?: number; // optional UnixTime (seconds)
  sender?: string; // optional dedicated sender line
  [extra: string]: any; // forward compatibility
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
  startdate: number; // required UnixTime seconds
  enddate?: number; // optional UnixTime seconds
  status?: number; // optional delivery status code filter
  [extra: string]: any;
}

/**
 * Response entry for CountOutbox.
 * sumpart * tariff = cost (per doc)
 */
export interface CountOutboxEntry {
  startdate: number;
  enddate: number; // server echoes a normalized end value (may equal startdate)
  sumpart: number; // total message parts (concatenated segments) sent
  sumcount: number; // total count of logical messages sent
  cost: number; // total billing cost in Rial
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
  startdate: number; // required UnixTime seconds
  enddate?: number; // optional UnixTime seconds
  linenumber?: string; // optional dedicated line number
  isread?: number | boolean; // optional filter: 0 unread, 1 read
  [extra: string]: any;
}

// Response entry for CountInbox
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

export interface AccountConfigParams {
  apilogs?: boolean | number;
  dailyreport?: boolean | number;
  debugmode?: boolean | number;
  defaultsender?: string;
  mincreditalarm?: number;
  resendfailed?: boolean | number;
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
  receptor: string; // comma separated list (1..200 numbers)
  message: string; // TTS message text
  date?: number; // future schedule (unix seconds)
  localid?: string; // optional single OR comma-separated list matching receptor count
  repeat?: number; // 0..5 (currently inactive server-side but validated client-side)
  tag?: string; // analytics tag (server accepts same constraints as SMS tag)
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

// ---------------- Account Info (اطلاعات حساب کاربری) ----------------
/**
 * Response entry shape for account/info endpoint.
 * remaincredit: اعتبار باقی مانده (ریال)
 * expiredate: UnixTime انقضاء (جنبه امنیتی؛ نگران انقضاء حساب نباشید)
 * type: نوع حساب (master | child)
 */
export interface AccountInfoEntry {
  remaincredit: number;
  expiredate: number; // UnixTime (seconds)
  type: 'master' | 'child' | string; // keep string fallback for forward compatibility
  [extra: string]: any;
}

// Utility union for parameter objects accepted by request wrapper
export type AnyParams =
  | SendParams
  | StatusParams
  | ReceiveParams
  | LookupParams
  | AccountConfigParams
  | PostalCodeParams
  | CallMakeTTSParams
  | SelectOutboxParams
  | LatestOutboxParams
  | CountOutboxParams
  | LineBlockedListParams
  | CountInboxParams
  | Record<string, any>;

export class KavenegarApi {
  private host: string;
  private version: string;
  private apikey: string;

  constructor(options: KavenegarClientOptions) {
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
  private normalizeStatusParams(params: StatusParams, key: 'messageid' | 'localid'): StatusParams {
    const value = params[key];
    if (typeof value === 'undefined' || value === null) return params;
    let ids: Array<string | number>; // working list
    if (Array.isArray(value)) {
      ids = value;
    } else if (typeof value === 'string') {
      // Allow user-provided comma separated string (trim spaces)
      ids = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    } else {
      ids = [value];
    }
    if (ids.length > 500) {
      throw new Error('Status request exceeds 500 ids limit');
    }
    // Rebuild as comma separated string (numbers remain as-is, ensure no extraneous spaces)
    const joined = ids.join(',');
    return { ...params, [key]: joined };
  }

  private request<T = any, M = any>(
    action: string,
    method: string,
    params: AnyParams,
    callback?: KavenegarCallback<T>
  ): Promise<KavenegarApiResponse<T, M>> {
    return new Promise((resolve, reject) => {
      const path = `/${this.version}/${this.apikey}/${action}/${method}.json`;
      const postdata = querystring.stringify(params as any);
      const postOptions: https.RequestOptions = {
        host: this.host,
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(postdata),
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };

      const req = https.request(postOptions, res => {
        res.setEncoding('utf8');
        let result = '';
        res.on('data', chunk => (result += chunk));
        res.on('end', () => {
          try {
            const jsonObject: KavenegarApiResponse<T, M> = JSON.parse(result);
            if (callback) {
              callback(
                jsonObject.entries as T,
                jsonObject.return.status,
                jsonObject.return.message
              );
            }
            resolve(jsonObject);
          } catch (err: any) {
            if (callback) {
              callback(undefined, 500, err?.message);
            }
            reject(err);
          }
        });
      });

      req.write(postdata, 'utf8');
      req.on('error', e => {
        if (callback) callback(undefined, 500, e.message);
        reject(e);
      });
      req.end();
    });
  }

  // API Methods
  Send(params: SendParams, cb?: KavenegarCallback) {
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
  SendArray(params: SendArrayParams, cb?: KavenegarCallback) {
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
    const payload: Record<string, any> = {
      receptor: JSON.stringify(receptor),
      sender: JSON.stringify(sender),
      message: JSON.stringify(message)
    };
    if (params.date) payload.date = params.date;
    if (params.tag) payload.tag = params.tag;
    if (typeof params.hide !== 'undefined') payload.hide = params.hide ? 1 : 0;
    if (type) payload.type = JSON.stringify(type);
    if (localmessageids) payload.localmessageids = JSON.stringify(localmessageids);

    return this.request('sms', 'sendarray', payload, cb);
  }
  Status(params: StatusParams, cb?: KavenegarCallback) {
    const normalized = this.normalizeStatusParams(params, 'messageid');
    return this.request<StatusEntry[]>('sms', 'status', normalized, cb);
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
  StatusLocalMessageid(params: StatusParams, cb?: KavenegarCallback) {
    const normalized = this.normalizeStatusParams(params, 'localid');
    return this.request<StatusEntry[]>('sms', 'statuslocalmessageid', normalized, cb);
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
  Select(params: SelectParams, cb?: KavenegarCallback<SelectEntry[]>) {
    if (!params || typeof params.messageid === 'undefined' || params.messageid === null) {
      throw new Error('messageid is required');
    }
    const normalized = this.normalizeStatusParams(params as StatusParams, 'messageid');
    return this.request<SelectEntry[]>('sms', 'select', normalized, cb as KavenegarCallback<SelectEntry[]>);
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
  SelectOutbox(params: SelectOutboxParams, cb?: KavenegarCallback<SelectEntry[]>) {
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
    return this.request<SelectEntry[]>('sms', 'selectoutbox', params, cb as KavenegarCallback<SelectEntry[]>);
  }
  LatestOutbox(params: Record<string, any>, cb?: KavenegarCallback) {
    // Provide strongly typed + validated version (backward compatible with loose call sites)
    const p: LatestOutboxParams = { ...params };
    if (typeof p.pagesize === 'undefined' || p.pagesize === null) {
      p.pagesize = 500; // explicit default so behavior is predictable
    } else {
      if (typeof p.pagesize !== 'number' || !Number.isFinite(p.pagesize)) {
        throw new Error('pagesize must be a number');
      }
      if (p.pagesize < 1 || p.pagesize > 500) {
        throw new Error('pagesize must be between 1 and 500');
      }
    }
    return this.request<LatestOutboxEntry[]>('sms', 'latestoutbox', p, cb as KavenegarCallback<LatestOutboxEntry[]>);
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
    CountOutbox(params: CountOutboxParams, cb?: KavenegarCallback<CountOutboxEntry[]>) {
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
      } else {
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
      const payload: Record<string, any> = { startdate: params.startdate };
      if (params.enddate !== undefined) payload.enddate = params.enddate;
      if (params.status !== undefined) payload.status = params.status;
      return this.request<CountOutboxEntry[]>('sms', 'countoutbox', payload, cb as KavenegarCallback<CountOutboxEntry[]>);
    }
  Cancel(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'cancel', params, cb);
  }
  Receive(params: ReceiveParams, cb?: KavenegarCallback<ReceiveEntry[]>) {
    if (!params) throw new Error('params required');
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
    let isread: number;
    if (typeof params.isread === 'boolean') {
      isread = params.isread ? 1 : 0;
    } else if (params.isread === 0 || params.isread === 1) {
      isread = params.isread;
    } else {
      throw new Error('isread must be 0, 1, false, or true');
    }
    const payload: Record<string, any> = { linenumber, isread };
    // Pass through optional date filters if user supplied (not in new snippet but kept for compatibility)
    if (typeof params.fromdate === 'number') payload.fromdate = params.fromdate;
    if (typeof params.todate === 'number') payload.todate = params.todate;
    return this.request<ReceiveEntry[]>('sms', 'receive', payload, cb as KavenegarCallback<ReceiveEntry[]>);
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
  InboxPaged(params: InboxPagedParams, cb?: KavenegarCallback<ReceiveEntry[]>) {
    if (!params) throw new Error('params required');
    const { linenumber } = params;
    if (!linenumber || typeof linenumber !== 'string' || !linenumber.trim()) {
      throw new Error('linenumber is required and must be non-empty string');
    }
    if (typeof params.isread === 'undefined' || params.isread === null) {
      throw new Error('isread is required (0 for unread, 1 for read)');
    }
    let isread: 0 | 1;
    if (typeof params.isread === 'boolean') {
      isread = params.isread ? 1 : 0;
    } else if (params.isread === 0 || params.isread === 1) {
      isread = params.isread;
    } else {
      throw new Error('isread must be 0, 1, false or true');
    }
    const payload: Record<string, any> = { linenumber, isread };
    if (typeof params.startdate === 'number') payload.startdate = params.startdate;
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
    return this.request<ReceiveEntry[], InboxPagedMetadata>(
      'sms',
      'inboxpaged',
      payload,
      cb as KavenegarCallback<ReceiveEntry[]>
    );
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
  CountInbox(params: CountInboxParams, cb?: KavenegarCallback<CountInboxEntry[]>) {
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
    } else {
      end = nowSec;
      if (end - params.startdate > ONE_DAY) {
        throw new Error('Maximum allowed range is 1 day (86400 seconds)');
      }
    }
    let isread: number | undefined;
    if (params.isread !== undefined) {
      if (typeof params.isread === 'boolean') {
        isread = params.isread ? 1 : 0;
      } else if (params.isread === 0 || params.isread === 1) {
        isread = params.isread;
      } else {
        throw new Error('isread must be 0, 1, false or true when provided');
      }
    }
    if (params.linenumber !== undefined) {
      if (typeof params.linenumber !== 'string' || !params.linenumber.trim()) {
        throw new Error('linenumber must be a non-empty string when provided');
      }
    }
    // Build payload (omit synthetic enddate if user omitted it so server uses its own "now")
    const payload: Record<string, any> = { startdate: params.startdate };
    if (params.enddate !== undefined) payload.enddate = params.enddate;
    if (params.linenumber !== undefined) payload.linenumber = params.linenumber;
    if (isread !== undefined) payload.isread = isread;
    return this.request<CountInboxEntry[]>(
      'sms',
      'countinbox',
      payload,
      cb as KavenegarCallback<CountInboxEntry[]>
    );
  }
  CountPostalCode(params: PostalCodeParams, cb?: KavenegarCallback) {
    return this.request('sms', 'countpostalcode', params, cb);
  }
  SendByPostalCode(params: PostalCodeParams, cb?: KavenegarCallback) {
    return this.request('sms', 'sendbypostalcode', params, cb);
  }
  /**
   * High-priority verification message sender (Verify Lookup)
   * Only needs receptor + template + at least token.
   * Server chooses best sender number automatically.
   */
  VerifyLookup(params: LookupParams, cb?: KavenegarCallback) {
    return this.request('verify', 'lookup', params, cb);
  }
  AccountInfo(params: Record<string, any>, cb?: KavenegarCallback) {
    // Endpoint does not require parameters; allow passing empty object or omitted.
    const payload = params || {};
    return this.request<AccountInfoEntry>('account', 'info', payload, cb as KavenegarCallback<AccountInfoEntry>);
  }
  AccountConfig(params: AccountConfigParams, cb?: KavenegarCallback) {
    return this.request('account', 'config', params, cb);
  }
  CallMakeTTS(params: CallMakeTTSParams, cb?: KavenegarCallback) {
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
    const payload: Record<string, any> = {
      receptor: receptors.join(','),
      message: params.message
    };
    if (typeof params.date === 'number') payload.date = params.date;
    if (localid) payload.localid = localid;
    if (typeof params.repeat === 'number') payload.repeat = params.repeat;
    if (params.tag) payload.tag = params.tag;
    return this.request<CallMakeTTSEntry>('call', 'maketts', payload, cb as KavenegarCallback<CallMakeTTSEntry>);
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
  StatusByReceptor(params: StatusByReceptorParams, cb?: KavenegarCallback) {
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
    const payload: Record<string, any> = { receptor: params.receptor, startdate };
    if (enddate !== undefined) payload.enddate = enddate;
    return this.request<StatusByReceptorEntry[]>(
      'sms',
      'statusbyreceptor',
      payload,
      cb as KavenegarCallback<StatusByReceptorEntry[]>
    );
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
  LineBlockedList(
    params: LineBlockedListParams,
    cb?: KavenegarCallback<LineBlockedNumberEntry[]>
  ) {
    if (!params || typeof params.linenumber !== 'string' || !params.linenumber.trim()) {
      throw new Error('linenumber is required and must be non-empty string');
    }
    const payload: Record<string, any> = { linenumber: params.linenumber };
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
    return this.request<LineBlockedNumberEntry[], LineBlockedListMetadata>(
      'Line/blocked',
      'list',
      payload,
      cb as KavenegarCallback<LineBlockedNumberEntry[]>
    );
  }
}

// Factory function with backward-compatible CommonJS style
export function KavenegarApiFactory(options: KavenegarClientOptions) {
  return new KavenegarApi(options);
}

// Default export for modern usage
export default KavenegarApi;
