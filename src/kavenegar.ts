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
  date?: number;
  localid?: string | string[];
  type?: number; // message type
  hide?: boolean;
}

export interface StatusParams {
  messageid?: string | number | Array<string | number>;
  localid?: string | number | Array<string | number>;
}

export interface ReceiveParams {
  line?: string;
  isread?: boolean | number; // API might return 0/1
  fromdate?: number;
  todate?: number;
}

export type LookupParams = Record<string, string | number | undefined> & {
  template: string;
  receptor: string;
  token?: string;
  token2?: string;
  token3?: string;
  token10?: string;
  token20?: string;
  token30?: string;
  type?: string | number;
};

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
  SendArray(params: Record<string, any>, cb?: KavenegarCallback) {
    return this.request('sms', 'sendarray', params, cb);
  }
  Status(params: StatusParams, cb?: KavenegarCallback) {
    return this.request('sms', 'status', params, cb);
  }
  StatusLocalMessageid(params: StatusParams, cb?: KavenegarCallback) {
    return this.request('sms', 'statuslocalmessageid', params, cb);
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
