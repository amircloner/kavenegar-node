import https from 'https';
import querystring from 'querystring';

// Generic shape of API response from Kavenegar
export interface KavenegarReturnStatus {
  status: number; // e.g., 200 for success
  message: string;
}

export interface KavenegarApiResponse<TEntry = any> {
  entries: TEntry;
  return: KavenegarReturnStatus;
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

export interface ReceiveParams {
  line?: string;
  isread?: boolean | number; // API might return 0/1
  fromdate?: number;
  todate?: number;
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

export interface CallMakeTTSParams {
  receptor: string; // comma separated list
  message: string; // TTS message
  date?: number;
  localid?: string;
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

  private request<T = any>(
    action: string,
    method: string,
    params: AnyParams,
    callback?: KavenegarCallback<T>
  ): Promise<KavenegarApiResponse<T>> {
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
            const jsonObject: KavenegarApiResponse<T> = JSON.parse(result);
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
  StatusLocalMessageid(params: StatusParams, cb?: KavenegarCallback) {
    const normalized = this.normalizeStatusParams(params, 'localid');
    return this.request<StatusEntry[]>('sms', 'statuslocalmessageid', normalized, cb);
  }
  Select(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'select', params, cb);
  }
  SelectOutbox(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'selectoutbox', params, cb);
  }
  LatestOutbox(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'latestoutbox', params, cb);
  }
  CountOutbox(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'countoutbox', params, cb);
  }
  Cancel(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'cancel', params, cb);
  }
  Receive(params: ReceiveParams, cb?: KavenegarCallback) {
    return this.request('sms', 'receive', params, cb);
  }
  CountInbox(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'countinbox', params, cb);
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
    return this.request('account', 'info', params, cb);
  }
  AccountConfig(params: AccountConfigParams, cb?: KavenegarCallback) {
    return this.request('account', 'config', params, cb);
  }
  CallMakeTTS(params: CallMakeTTSParams, cb?: KavenegarCallback) {
    return this.request('call', 'maketts', params, cb);
  }
}

// Factory function with backward-compatible CommonJS style
export function KavenegarApiFactory(options: KavenegarClientOptions) {
  return new KavenegarApi(options);
}

// Default export for modern usage
export default KavenegarApi;
