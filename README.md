<div align="center">

# Kavenegar Node.js SDK

High level, fully typed (TypeScript) SDK for the [Kavenegar](https://kavenegar.com) SMS / Voice / Verify REST API.

</div>

> این کتابخانه نسخه مدرن و به‑روز شده کیت توسعه کاوه نگار برای Node.js است و اکثر متدهای عمومی (ارسال، دریافت، گزارش وضعیت، اینباکس صفحه بندی شده، پیام صوتی TTS، تنظیمات حساب، آمار ارسال/دریافت، ارسال گروهی، اعتبارسنجی (Lookup) و …) را پوشش می‌دهد.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
    - [TypeScript / ESM](#typescript--esm)
    - [CommonJS](#commonjs)
- [Usage Examples](#usage-examples)
    - [Send Single SMS (Send)](#send-single-sms-send)
    - [Bulk Parallel Send (SendArray)](#bulk-parallel-send-sendarray)
    - [Verify / OTP (VerifyLookup)](#verify--otp-verifylookup)
    - [Receive Inbox (Receive)](#receive-inbox-receive)
    - [Paged Inbox (InboxPaged)](#paged-inbox-inboxpaged)
    - [Blocked Numbers (LineBlockedList)](#blocked-numbers-lineblockedlist)
    - [Delivery Status (Status)](#delivery-status-status)
    - [Delivery Status by Local Id (StatusLocalMessageid)](#delivery-status-by-local-id-statuslocalmessageid)
    - [Select (Detailed Sent Messages)](#select-detailed-sent-messages)
    - [SelectOutbox (Sent List Window)](#selectoutbox-sent-list-window)
    - [LatestOutbox](#latestoutbox)
    - [CountOutbox (Sent Aggregates)](#countoutbox-sent-aggregates)
    - [CountInbox (Received Aggregates)](#countinbox-received-aggregates)
    - [StatusByReceptor](#statusbyreceptor)
    - [AccountInfo](#accountinfo)
    - [AccountConfig](#accountconfig)
    - [Voice TTS Call (CallMakeTTS)](#voice-tts-call-callmaketts)
    - [Postal Code Targeting](#postal-code-targeting-countpostalcode--sendbypostalcode)
    - [Cancel Scheduled Messages](#cancel-scheduled-messages)
- [Parameter Validation & Errors](#parameter-validation--errors)
- [TypeScript Typings](#typescript-typings)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Persian Guide / راهنمای فارسی](#persian-guide--راهنمای-فارسی)

## Features

- Promise based, still supports legacy callbacks
- Rich TypeScript definitions for params and responses
- Client‑side validation mirroring official constraints (id limits, date windows, array length, etc.)
- Supports: Send, SendArray, VerifyLookup (OTP), Receive, InboxPaged, LineBlockedList, Status, StatusLocalMessageid, Select, SelectOutbox, LatestOutbox, CountOutbox, CountInbox, StatusByReceptor, AccountInfo, AccountConfig, CallMakeTTS (Voice TTS), Postal Code (CountPostalCode / SendByPostalCode), Cancel
- Normalizes flexible inputs (arrays, comma separated strings, booleans for 0/1)
- Safe: rejects oversize batches (e.g. >500 ids)
- Zero production dependencies

## Installation

```bash
npm install kavenegar
# or
yarn add kavenegar
```

You need an API key: create an account and obtain the key from the panel.

## Quick Start

### TypeScript / ESM

```ts
import { KavenegarApi } from 'kavenegar';

const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function run(){
    const res = await api.Send({
        receptor: '09123456789',
        message: 'Hello from Kavenegar Node SDK',
        sender: '10004346'
    });
    console.log(res.return.status, res.entries);
}
run();
```

### CommonJS

```js
const { KavenegarApi } = require('kavenegar');
const api = new KavenegarApi({ apikey: 'your-api-key' });
api.Send({ receptor: '09123456789', message: 'Hi', sender: '10004346' }, (entries, status, message) => {
    console.log(status, message, entries);
});
```

---

## Usage Examples

### Send Single SMS (Send)

```ts
await api.Send({
    receptor: '09123456789,09367891011',
    message: 'خدمات پیام کوتاه کاوه نگار',
    sender: '10004346',
    // date: 1734000000,  // optional future unix seconds
    // localid: 'id1,id2',
    hide: 1,
    tag: 'register-flow'
});
```

Sample (truncated) response shape:

```json
{
    "return": { "status":200, "message":"تایید شد" },
    "entries": [
        {"messageid":8792343,"status":1,"statustext":"در صف ارسال","sender":"10004346","receptor":"09123456789","date":1356619709,"cost":120}
    ]
}
```

Key params: receptor (csv), message, optional sender/date/localid/hide/tag.

### Bulk Parallel Send (SendArray)

Send N distinct messages from N senders to N receptors (arrays must be equal length):

```ts
await api.SendArray({
    receptor: ['09123456789','09123456780'],
    sender:   ['10008445','10008445'],
    message:  ['پیام اول','پیام دوم'],
    hide: true,
    tag: 'campaign-a'
});
```

Throws `LengthMismatch` before network if mandatory arrays differ.

### Verify / OTP (VerifyLookup)

```ts
await api.VerifyLookup({
    receptor: '09361234567',
    template: 'registerverify',
    token: '852596',
    // token2, token3, token10, token20, type: 'sms' | 'call', tag
});
```

### Receive Inbox (Receive)

Fetch unread inbound messages until drained (max 100 per call; unread messages become read after fetch):

```ts
async function drain(line: string){
    let collected: any[] = [];
    while(true){
        const res = await api.Receive({ linenumber: line, isread: 0 });
        const batch = res.entries || [];
        collected = collected.concat(batch);
        if(batch.length < 100) break;
    }
    return collected;
}
```

### Paged Inbox (InboxPaged)

```ts
const first = await api.InboxPaged({ linenumber: '3000202030', isread: 0, pagenumber: 1 });
console.log(first.metadata);
```

`metadata` => `{ totalcount, currentpage, totalpages, pagesize }` (pagesize typically 200). Keep requesting while `currentpage < totalpages`.

### Blocked Numbers (LineBlockedList)

```ts
const blocked = await api.LineBlockedList({ linenumber: '30002225', pagenumber: 1 });
```

Loop pages while `currentpage < totalpages`.

### Delivery Status (Status)

```ts
const r = await api.Status({ messageid: [85463238, 85463239] });
```

Max 500 ids per call. Accepts single id, array, or csv string.

### Delivery Status by Local Id (StatusLocalMessageid)

```ts
await api.StatusLocalMessageid({ localid: 'loc1,loc2,loc3' });
```

Only last ~12 hours; still max 500 ids.

### Select (Detailed Sent Messages)

Richer payload (includes text, receptor, cost, date) vs `Status`:

```ts
await api.Select({ messageid: '85463238,85463239' });
```

### SelectOutbox (Sent List Window)

List sent messages in a constrained time window (startdate required, <=4 days old, span <=1 day):

```ts
await api.SelectOutbox({ startdate: Math.floor(Date.now()/1000) - 3600 }); // last hour
```

### LatestOutbox

Fetch latest N (1..500, default 500) sent records (no pagination):

```ts
await api.LatestOutbox({ pagesize: 100 });
```

### CountOutbox (Sent Aggregates)

```ts
const stats = await api.CountOutbox({ startdate: Math.floor(Date.now()/1000) - 1800 });
```

Returns one row with `sumpart`, `sumcount`, `cost`.

### CountInbox (Received Aggregates)

```ts
const recStats = await api.CountInbox({ startdate: Math.floor(Date.now()/1000) - 3600 });
```

Constraints: startdate <= 60 days old; span <= 1 day.

### StatusByReceptor

```ts
await api.StatusByReceptor({ receptor: '09123456789', startdate: Math.floor(Date.now()/1000) - 3600 });
```

### AccountInfo

```ts
const info = await api.AccountInfo({});
console.log(info.entries.remaincredit);
```

### AccountConfig

Fetch current or update selected fields:

```ts
await api.AccountConfig({ defaultsender: '10004346', apilogs: 'justfaults', debugmode: true });
```

Accepted toggles: `enabled | disabled | justfaults (apilogs) | true/false | 1/0` (library normalizes).

### Voice TTS Call (CallMakeTTS)

Text to speech outbound call (1..200 receptors):

```ts
await api.CallMakeTTS({
    receptor: '09123456789,09350000000',
    message: 'کد تایید شما ۱ ۲ ۳ ۴',
    // date, localid, repeat (0..5), tag
});
```

### Postal Code Targeting (CountPostalCode / SendByPostalCode)

Endpoints are exposed as low level helpers (no extra validation yet):

```ts
await api.CountPostalCode({ postalcode: '1234567890' });
await api.SendByPostalCode({ postalcode: '1234567890', sender: '10004346' });
```

### Cancel Scheduled Messages

If you scheduled messages (`date` in the future) you may attempt cancellation (API limitations apply):

```ts
await api.Cancel({ messageid: '85463238,85463239' });
```

---

## Parameter Validation & Errors

The SDK performs early checks and throws before network when:

| Scenario | Validation |
|----------|------------|
| Status / Select ids | >500 ids => Error `Status request exceeds 500 ids limit` |
| SendArray | Unequal array lengths => `LengthMismatch` |
| Date windows | Out-of-range spans (e.g. CountOutbox >1 day) => descriptive Error |
| InboxPaged | enddate < startdate or span > 2 days => Error |
| LatestOutbox | pagesize not 1..500 => Error |
| CountInbox/Outbox | startdate too old or span exceeded => Error |
| CallMakeTTS | >200 receptors, invalid repeat/date/tag => Error |
| AccountConfig | Invalid toggle or malformed field => Error |

Server still may return documented status codes (e.g. 400, 407, 412, 417, 418, 424, 607). They appear under `response.return.status` with a localized `message`.

### Common Status Codes (Selected)

| Code | Meaning (fa/en summary) |
|------|-------------------------|
| 200 | Success / تایید شد |
| 400 | Invalid / missing params |
| 407 | Access denied (IP / permissions) |
| 412 | Invalid sender line |
| 414 | Too many receptors / ids |
| 417 | Invalid date range |
| 418 | Insufficient credit |
| 424 | Template not found (Verify) |
| 428 | Call not possible (Verify type=call) |
| 431 | Invalid code structure (Verify) |
| 432 | Missing token placeholder in template |
| 607 | Invalid tag |

## TypeScript Typings

All exported interfaces live in the distributed `d.ts` (`SendParams`, `SendArrayParams`, `StatusEntry`, `ReceiveEntry`, `InboxPagedMetadata`, `CountOutboxEntry`, `LineBlockedNumberEntry`, `AccountInfoEntry`, `AccountConfigEntry`, `CallMakeTTSEntry`, etc.).

Typical generic response shape:

```ts
interface KavenegarApiResponse<TEntries, TMeta = any> {
    entries: TEntries;
    return: { status: number; message: string };
    metadata?: TMeta; // only for paged responses
}
```

All methods return `Promise<KavenegarApiResponse<...>>` when callback not supplied.

## FAQ

**Q: Why do some methods limit ids or time windows?**  
Mirrors upstream REST service constraints (performance & data retention); enforcing early saves a round trip.

**Q: Do I need to import from `dist/`?**  
No. Use `import { KavenegarApi } from 'kavenegar';` — the package `exports` map resolves to the built file.

**Q: How do I handle localized (Persian) status texts?**  
The service returns `statustext` in Persian. You can map codes (`status`) to your own translations if needed.

**Q: Are retries implemented?**  
No automatic retries; implement idempotency via your `localid` and retry logic of choice.

## Contributing

Issues, pull requests and documentation improvements are welcome.  
Email: <support@kavenegar.com>  
GitHub Issues: <https://github.com/KaveNegar/kavenegar-node/issues>

Steps:
1. Fork & clone
2. `npm install`
3. Make changes (edit TypeScript in `src/`)
4. `npm run build`
5. Open PR

## Persian Guide / راهنمای فارسی

بخش عمده مثال‌ها دو زبانه در بالا آمده است. برای جزئیات کامل فارسی می‌توانید به مستندات رسمی مراجعه کنید:

- مستند وب سرویس: <http://kavenegar.com/rest.html>
- عضویت / دریافت کلید: <https://panel.kavenegar.com/Client/Membership/Register>
- آموزش ارسال پیامک (SDK): <http://kavenegar.com/sdk.html>

### نکات کلیدی فارسی

- `receptor` می‌تواند لیست جدا شده با کاما باشد.
- برای جلوگیری از ارسال تکراری از `localid` (تک) یا `localmessageids` (آرایه در SendArray) استفاده کنید.
- پیام‌های دریافتی با `Receive` در حالت `isread=0` پس از واکشی خوانده می‌شوند.
- حداکثر 500 شناسه در متدهای وضعیت (Status, Select, ...) و حداکثر 200 شماره در ارسال گروهی صوتی یا آرایه‌ای.
- بازه‌های زمانی را مطابق توضیحات هر متد (۱ روز، ۲ روز، ۴ روز، ۶۰ روز) رعایت کنید؛ کتابخانه خطا می‌دهد.
- برای Voice TTS از متد `CallMakeTTS` استفاده کنید (تلفن گویا ساده – متن تبدیل به گفتار).

## Legacy Credits

Original work & earlier versions by community contributors. This revision modernizes the codebase with TypeScript and extended documentation.

---

<div dir='rtl' align='center'>
اگر در استفاده از کتابخانه مشکلی یا پیشنهادی داشتید با Pull Request یا ایمیل به <a href="mailto:support@kavenegar.com?Subject=SDK">support@kavenegar.com</a> ما را خوشحال کنید.
<br/><br/>
<a href="http://kavenegar.com"><img alt="Kavenegar" src="http://kavenegar.com/public/images/logo.png" width="220"/></a>
<br/>
<a href="http://kavenegar.com">kavenegar.com</a>
</div>


## دریافت پیامک های ورودی (Receive Inbox)

این متد برای بازیابی پیامک‌های دریافتی روی یک خط اختصاصی استفاده می‌شود. در صورتی که «URL دریافت لحظه‌ای» را در پنل تنظیم کرده باشید، پیامک‌ها بلافاصله به آدرس شما POST می‌شوند. اما اگر به هر دلیل نرسند یا URL نداشته باشید، می‌توانید با این متد آنها را (تا زمانی که خوانده نشده اند) بازیابی کنید.

در هر بار فراخوانی حداکثر 100 رکورد بازگردانده می‌شود. کافی است تا وقتی که تعداد رکوردهای برگشتی 100 است مجدداً متد را فراخوانی کنید تا صف تخلیه شود. پس از اینکه پیامک‌ها با `isread=0` واکشی شدند، وضعیت آنها در سامانه به «خوانده شده» تغییر می‌کند (`isRead = 1`).

### ورودی

| پارامتر | وضعیت | نوع | توضیح |
|---------|-------|-----|-------|
| linenumber | اجباری | String | شماره خط اختصاصی (مثل 30002225) |
| isread | اجباری | 0/1 | 0 = پیامک‌های خوانده نشده (جدید)، 1 = فقط پیامک‌های علامت زده شده به عنوان خوانده شده |

نکات:
1. برای دریافت پیامک‌های جدید مقدار `isread=0` ارسال کنید.
2. پس از واکشی با `isread=0`، پیامک‌ها در سامانه خوانده شده می‌شوند و نیاز به دریافت مجدد ندارند مگر اینکه پیام جدیدی رسیده باشد.
3. حداکثر 100 رکورد در هر پاسخ – اگر طول آرایه 100 بود، فراخوانی بعدی را انجام دهید.
4. کتابخانه برای سازگاری نسخه‌های قبلی `line` را هم قبول کرده و به `linenumber` نگاشت می‌کند.
5. می‌توانید `isread` را به صورت boolean (`true/false`) نیز ارسال کنید؛ به 1/0 تبدیل می‌شود.

### خروجی نمونه

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        {
            "messageid": 35850015,
            "message": "خدمات پیام کوتاه کاوه نگار",
            "sender": "09*********",
            "receptor": "3000202030",
            "date": 1357206241
        },
        {
            "messageid": 35850016,
            "message": "خدمات پیام کوتاه کاوه نگار",
            "sender": "09*********",
            "receptor": "3000202030",
            "date": 1357103281
        }
    ]
}
```

### مثال استفاده (JavaScript)

```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });

async function fetchUnread(){
    let all = [];
    while(true){
        const res = await api.Receive({ linenumber: '3000202030', isread: 0 });
        const batch = res.entries || [];
        all = all.concat(batch);
        if(batch.length < 100) break; // no more pages
    }
    console.log('Total unread received:', all.length);
}
fetchUnread();
```

### TypeScript / Promise

```ts
import { KavenegarApi, ReceiveEntry } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function unreadBatches(){
    const first = await api.Receive({ linenumber: '3000202030', isread: 0 });
    const entries: ReceiveEntry[] = first.entries;
    entries.forEach(m => console.log(m.messageid, m.sender, m.message));
}
unreadBatches();
```

### English Summary (Receive Inbox)

Fetch inbound (MO) SMS messages for a dedicated line. Required params: `linenumber` (your line) and `isread` (0 for unread/new, 1 for already marked as read). Each call returns up to 100 messages. To drain the inbox keep calling while each response returns 100 records. When you pull with `isread=0` the returned messages become marked as read server-side. The SDK accepts legacy `line` alias and boolean `isread` values (true/false) which are normalized to 1/0.

#### Example (loop until empty)
```ts
async function drain(api: KavenegarApi, line: string){
    const collected: ReceiveEntry[] = [];
    while(true){
        const res = await api.Receive({ linenumber: line, isread: 0 });
        const list = res.entries || [];
        collected.push(...list);
        if(list.length < 100) break;
    }
    return collected;
}
```

Error cases: 400 (missing/invalid params), 407 (access denied), others per platform policy.

---

## دریافت پیامک صفحه بندی شده (InboxPaged)

این متد نسخه صفحه‌بندی شده دریافت پیامک های ورودی است و علاوه بر آرایه `entries`، شیء `metadata` شامل اطلاعات صفحه فعلی را بازمی‌گرداند.

مطابق مستند ارائه شده:

پارامترهای ورودی:

| نام | وضعیت | نوع | توضیح |
|-----|-------|-----|-------|
| linenumber | اجباری | String | شماره خط (مثال: 3000202030) |
| isread | اجباری | Integer (0/1) یا Boolean | 0 = پیامک های خوانده نشده (جدید)، 1 = پیامک های خوانده شده |
| startdate | اختیاری | UnixTime (sec) | تاریخ آغاز بازه (حداکثر 2 روز فاصله با enddate) |
| enddate | اختیاری | UnixTime (sec) | تاریخ پایان بازه؛ نباید از startdate کوچکتر باشد؛ حداکثر فاصله 2 روز |
| pagenumber | اختیاری | Integer | شماره صفحه (۱ مبنا). اگر ارسال نشود صفحه ۱ در نظر گرفته میشود. |

خروجی (نمونه):

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        { "messageid": 35850015, "message": "خدمات پیام کوتاه کاوه نگار", "sender": "09*********", "receptor": "3000202030", "date": 1357206241 },
        { "messageid": 35850016, "message": "خدمات پیام کوتاه کاوه نگار", "sender": "09*********", "receptor": "3000202030", "date": 1357103281 }
    ],
    "metadata": {
        "totalcount": "2",
        "currentpage": "1",
        "totalpages": "1",
        "pagesize": "200"
    }
}
```

توضیح فیلدهای metadata:

| فیلد | توضیح |
|------|-------|
| totalcount | تعداد کل پیام ها (برای حالت isread=0 تعداد کل «باقی مانده» به جز پیام های همین صفحه) |
| currentpage | شماره صفحه فعلی |
| totalpages | کل تعداد صفحات |
| pagesize | اندازه هر صفحه (بر اساس مستند 200) |

یادداشت ها:
1. حداکثر فاصله زمانی بین `startdate` و `enddate` دو روز است.
2. اگر تاریخ ها ارسال نشوند، بازه دو روز گذشته در نظر گرفته می شود (سمت سرویس).
3. اگر فقط `startdate` ارسال شود و `enddate` خالی باشد، سرویس بازه دو روزه را لحاظ می کند (مطابق مستند).
4. برای واکشی پیامک های جدید `isread=0` بفرستید؛ پیام های بازگشتی خوانده شده علامت می‌خورند.
5. جهت صفحه بعدی، `pagenumber` را افزایش دهید تا زمانی که `currentpage == totalpages` شود.

### استفاده در کتابخانه (TypeScript)

```ts
import { KavenegarApi, InboxPagedMetadata, ReceiveEntry } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function fetchAllUnreadPaged(line: string){
    let page = 1;
    const collected: ReceiveEntry[] = [];
    while(true){
        const res = await api.InboxPaged({ linenumber: line, isread: 0, pagenumber: page });
        const entries = res.entries || [];
        collected.push(...entries);
        const meta: InboxPagedMetadata | undefined = res.metadata;
        if(!meta || meta.currentpage === meta.totalpages) break;
        page += 1;
    }
    return collected;
}

fetchAllUnreadPaged('3000202030').then(all => {
    console.log('Total collected unread:', all.length);
});
```

### استفاده ساده (JavaScript / Callback)

```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });
api.InboxPaged({ linenumber: '3000202030', isread: 0, pagenumber: 1 }, function(entries, status, message){
    console.log(status, message);
    console.log('First page size:', entries && entries.length);
});
```

### English Summary (InboxPaged)
Retrieve inbound SMS messages with pagination. Required: linenumber, isread (0 unread / 1 read). Optional: startdate, enddate (max 2-day span), pagenumber (1-based). Response shape: { return, entries[], metadata{ totalcount, currentpage, totalpages, pagesize } }. Keep requesting while currentpage < totalpages to drain all pages. When reading unread with isread=0, returned messages become marked as read.

### Error Handling & Validation
Client side validation: ensures required parameters, positive pagenumber, enddate >= startdate, and span <= 2 days. Other constraints delegated to server responses (status codes 400/407 etc.).

---

## لیست شماره های مسدود کننده خط (LineBlockedList)

این متد، لیست شماره (موبایل) کاربرانی را برمی گرداند که دریافت پیامک از خط اختصاصی شما را مسدود (لغو) کرده اند. خروجی صفحه بندی است و در هر فراخوانی حداکثر 200 رکورد باز می گردد.

### پارامترهای ورودی

| نام | وضعیت | نوع | توضیح |
|-----|-------|-----|-------|
| linenumber | اجباری | String | شماره خط اختصاصی (مثل 30002225) |
| blockreason | اختیاری | Integer | دلیل مسدودسازی: 0 وب سرویس، 1 پنل کاربری، 2 لغو ۱۱، 3 ادمین، 10 نامشخص (اگر خالی باشد همه) |
| startdate | اختیاری | UnixTime | تاریخ شروع بازه (ثانیه). اگر ارسال نشود روز جاری در سمت سرویس لحاظ می شود |
| pagenumber | اختیاری | Integer | شماره صفحه (۱ مبنا). اگر خالی باشد صفحه 1 در نظر گرفته می شود |

### فیلدهای خروجی (metadata)

| فیلد | توضیح |
|------|-------|
| totalcount | تعداد کل رکوردهای مطابق فیلتر |
| currentpage | شماره صفحه فعلی |
| totalpages | کل صفحات |
| pagesize | اندازه صفحه (معمولاً 200) |

### نکات
1. برای واکشی کامل، تا زمانی که `currentpage < totalpages` است صفحه بعدی را درخواست کنید.
2. اگر `blockreason` ارسال نشود، سرویس همه دلایل را باز می گرداند.
3. مقدار `startdate` در صورت عدم ارسال، برای همان روز (سمت سرور) محاسبه می گردد.
4. حداکثر اندازه هر صفحه 200 رکورد است.

### نمونه درخواست (خام)
```
https://api.kavenegar.com/v1/{API-KEY}/Line/blocked/list.json?LineNumber=10002263&pageNumber=1&StartDate=1740300377&blockReason=0
```

### نمونه پاسخ
```json
{
    "metadata": {
        "totalcount": "1",
        "currentpage": "1",
        "totalpages": "1",
        "pagesize": "200"
    },
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        { "number": "09*********", "blockreason": 0, "date": 0 }
    ]
}
```

### مثال استفاده در کتابخانه (Promise / TypeScript)
```ts
import { KavenegarApi, LineBlockedNumberEntry, LineBlockedListMetadata } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function fetchAllBlocked(line: string){
    let page = 1;
    const all: LineBlockedNumberEntry[] = [];
    while(true){
        const res = await api.LineBlockedList({ linenumber: line, pagenumber: page });
        const list: LineBlockedNumberEntry[] = res.entries || [];
        all.push(...list);
        const meta = res.metadata as LineBlockedListMetadata | undefined;
        if(!meta || meta.currentpage === meta.totalpages) break;
        page += 1;
    }
    return all;
}

fetchAllBlocked('30002225').then(list => console.log('Blocked count:', list.length));
```

### مثال ساده (Callback / JavaScript)
```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });
api.LineBlockedList({ linenumber: '30002225', blockreason: 0, pagenumber: 1 }, function(entries, status, message){
    console.log(status, message);
    console.log(entries);
});
```

### English Summary (LineBlockedList)
Retrieve paginated list of subscriber numbers that have blocked receiving SMS from a specific dedicated line. Parameters: linenumber (required), blockreason (optional filter), startdate (optional Unix time start of day range), pagenumber (optional 1-based). Each response includes entries[{ number, blockreason, date }] and metadata { totalcount, currentpage, totalpages, pagesize }. Keep calling while currentpage < totalpages to accumulate the full set.

---

## دریافت اطلاعات حساب کاربری (AccountInfo)

این متد برای دریافت اطلاعات پایه حساب (یا زیرحساب های ایجاد شده توسط شما) استفاده می‌شود. مهم‌ترین فیلدهای خروجی «اعتبار باقی مانده» و «تاریخ انقضاء» هستند.

### آدرس (URL)

```text
https://api.kavenegar.com/v1/{API-KEY}/account/info.json
```

### خروجی

| فیلد | نوع | توضیح |
|------|-----|-------|
| remaincredit | Long | اعتبار باقی مانده (ریال) |
| expiredate | UnixTime | تاریخ انقضاء (صرفاً جنبه امنیتی) |
| type | String | نوع حساب: master یا child |

یادداشت‌ها:

1. مقدار remaincredit بر حسب ریال است.
2. expiredate بیشتر برای کنترل های داخلی امنیتی است؛ نگران متوقف شدن حساب با رسیدن این تاریخ نباشید.
3. اگر از زیرحساب‌ها استفاده می‌کنید (child) نوع حساب را می‌توانید تشخیص دهید.

### نمونه پاسخ اطلاعات حساب (Sample AccountInfo Response)

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": {
        "remaincredit": 1500000,
        "expiredate": 13548889,
        "type": "master"
    }
}
```

### مثال استفاده AccountInfo (Promise / TypeScript)

```ts
import { KavenegarApi, AccountInfoEntry } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function showAccount(){
    const res = await api.AccountInfo({}); // پارامتر خاصی لازم نیست
    const info: AccountInfoEntry = res.entries;
    console.log('Remain Credit (Rial):', info.remaincredit);
    console.log('Expire Date (unix):', info.expiredate, 'Type:', info.type);
}
showAccount();
```

### مثال ساده AccountInfo (Callback / JavaScript)

```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });
api.AccountInfo({}, function(entry, status, message){
    console.log(status, message);
    if(entry){
        console.log('Remain Credit:', entry.remaincredit);
        console.log('Expire:', entry.expiredate, 'Type:', entry.type);
    }
});
```

### English Summary (AccountInfo)

Fetch base account information: remaining credit (in Rial), security-oriented expire date (Unix time), and account type (master or child). No parameters required. Use to monitor balance before sending bulk messages or to display billing info in dashboards.

---

#### پارامترهای متد Send

| پارامتر | وضعیت | نوع | توضیح |
|---------|-------|-----|-------|
| receptor | اجباری | String | شماره یا لیست جداشده با ویرگول |
| message | اجباری | String | متن پیام (در GET/POST باید Encode شود) |
| sender | اختیاری | String | شماره خط ارسال؛ اگر خالی باشد از پیش فرض حساب استفاده می‌شود |
| date | اختیاری | UnixTime | زمان ارسال؛ در صورت خالی بودن فوری ارسال می‌شود |
| type | اختیاری | String/Number | نوع پیام در گوشی (فقط خطوط 3000) |
| localid | اختیاری | String | شناسه(های) محلی؛ در صورت تکرار، ارسال مجدد انجام نمی‌شود |
| hide | اختیاری | 0/1 | اگر 1 باشد شماره گیرنده در فهرست/کنسول مخفی می‌شود |
| tag | اختیاری | String | حداکثر 200 کاراکتر؛ فقط حروف و اعداد انگلیسی بدون فاصله؛ مجاز: - و _ |

خطاهای متداول: 414 (گیرنده بیش از 200)، 417 (تاریخ نامعتبر/گذشته)، 418 (اعتبار ناکافی)، 607 (تگ اشتباه)

### TypeScript / Modern Usage

You can now use the SDK with full TypeScript typings. First install:

```bash
npm install kavenegar
```

Import and use with promises:

```ts
import { KavenegarApi } from 'kavenegar/dist/kavenegar';
// Or: import KavenegarApi from 'kavenegar/dist/kavenegar';

const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function sendSample() {
    const res = await api.Send({
        message: 'Hello from TypeScript',
        receptor: '09123456789',
        sender: '10004346'
    });
    console.log(res.return.status, res.entries);
}
sendSample();
```

Or still use the callback style (backward compatible):

```ts
import { KavenegarApiFactory } from 'kavenegar/dist/kavenegar';
const api = KavenegarApiFactory({ apikey: 'your-key' });
api.Send({
    message: 'Hi',
    receptor: '09123456789'
}, (entries, status, message) => {
    console.log(status, message, entries);
});
```

Available typed parameter helpers include `SendParams`, `LookupParams`, `AccountConfigParams`, etc. Return values resolve to a `KavenegarApiResponse<T>` shape containing `entries` and a `return` status object.

If you are using CommonJS and want the old factory style:

```js
const { KavenegarApi } = require('kavenegar/dist/kavenegar');
const api = new KavenegarApi({ apikey: 'your-key' });
```

Verify Lookup:

```node
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({
    apikey: 'your apikey here'
});
api.VerifyLookup({
    receptor: "09361234567",
    token: "852596",
    template: "registerverify",
    // token2, token3, token10, token20 optional
    // type: 'sms' | 'call' (default sms)
    // tag: optional analytics tag defined in panel
}, function(response, status) {
    console.log(response);
    console.log(status);
});
/*
sample output
{
    "return":
    {
        "status":200,
        "message":"تایید شد"
    },
    "entries": {
            "messageid":8792343,
			"message": "ممنون از ثبت نام شما کد تایید عضویت  : 852596",
            "status":5,
            "statustext":"ارسال به مخابرات",
            "sender":"10004346",
            "receptor":"09361234567",
            "date":1356619709,
            "cost":120
   }    
    
}
*/
```

#### توضیحات سرویس اعتبار سنجی (Verify Lookup)
این متد برای ارسال کدهای تایید (OTP) و پیام های حیاتی (رمز عبور، کد تخفیف، فاکتور و ...) با بالاترین اولویت استفاده می‌شود. نیاز به تعیین فرستنده ندارید و سیستم بهترین پیش‌شماره داخلی یا بین‌المللی را انتخاب می‌کند. ارسال به ۱۴۸ کشور پشتیبانی می‌شود.

نمونه الگو:

```text
کد تایید عضویت
%token

ممنون از خرید شما
کد شارژ : %token
سریال : %token2
مدت اعتبار : %token3
```

پارامترهای ورودی مهم:

| نام | الزامی | توضیح |
|-----|--------|-------|
| receptor | بله | شماره گیرنده (بین المللی با 00) |
| template | بله | نام الگوی تایید شده در پنل |
| token | بله | حداکثر 100 کاراکتر بدون فاصله |
| token2, token3 | خیر | مشابه token |
| token10 | خیر | حداکثر 5 فاصله مجاز |
| token20 | خیر | حداکثر 8 فاصله مجاز |
| type | خیر | 'sms' یا 'call' (پیش فرض sms)؛ اگر token فقط عدد باشد تماس ممکن است |
| tag | خیر | تگ تحلیلی (حروف/اعداد انگلیسی، خط تیره یا زیرخط) |

خطاهای رایج: 418 (اعتبار ناکافی)، 424 (الگو یافت نشد)، 428 (امکان تماس نیست)، 431 (ساختار کد نادرست)، 432 (پارامتر token% در متن الگو وجود ندارد)، 607 (تگ اشتباه)

توجه: در صورت عدم قابلیت ارسال از خطوط داخلی، از پیش‌شماره بین‌المللی استفاده می‌شود.



### ارسال گروهی (SendArray)

این متد برای زمانی است که بخواهید چند «پیام»، از چند «خط»، به چند «گیرنده» ارسال کنید و هر سه آرایه با هم متناظر باشند.
همه آرایه‌های `receptor` و `sender` و `message` باید طول یکسان داشته باشند. در صورت استفاده از `type` یا `localmessageids` طول آنها هم باید برابر باشد. فراخوانی حتماً باید با متد POST انجام شود (کتابخانه به صورت پیش‌فرض POST است).

#### مثال ساده (CommonJS)
```node
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-apikey' });
api.SendArray({
        receptor: ['09123456789','09123456780','09123456781'],
        sender:   ['10008445','10008445','10008446'],
        message:  ['پیام اول','پیام دوم','پیام سوم'],
        // مقادیر اختیاری:
        // date: 1734000000,
        // type: [1,1,1],
        // localmessageids: ['loc1','loc2','loc3'],
        // hide: 1,
}, function(entries, status, statustext){
        console.log(status, statustext);
        console.log(entries);
});
```

#### TypeScript / Promise
```ts
import { KavenegarApi, SendArrayParams } from 'kavenegar/dist/kavenegar';

const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function bulk() {
    const params: SendArrayParams = {
        receptor: ['09123456789','09123456780'],
        sender:   ['10008445','10008445'],
        message:  ['Hello #1','Hello #2'],
        hide: true,
        tag: 'campaign-a'
    };
    const res = await api.SendArray(params);
    console.log(res.return.status, res.entries);
}
bulk();
```

نمونه پاسخ سرور (نمونه فرضی):
```json
{
    "return":{"status":200,"message":"تایید شد"},
    "entries":[
        {"messageid":8792343,"message":"پیام اول","status":1,"statustext":"در صف ارسال","sender":"10008445","receptor":"09123456789","date":1356619709,"cost":120},
        {"messageid":8792344,"message":"پیام دوم","status":1,"statustext":"در صف ارسال","sender":"10008445","receptor":"09123456780","date":1356619709,"cost":120}
    ]
}
```

#### پارامترها

| نام | الزامی | نوع | توضیح |
|-----|--------|-----|-------|
| receptor | بله | Array<String> | لیست شماره گیرندگان (هر کدام موبایل) |
| sender | بله | Array<String> | لیست شماره خطوط ارسال کننده |
| message | بله | Array<String> | لیست متن پیام ها (به همان ترتیب گیرنده) |
| date | خیر | UnixTime | زمان ارسال یکسان برای همه پیام ها |
| type | خیر | Array<Number/String> | نوع پیام (فقط خطوط 3000) |
| localmessageids | خیر | Array<String/Number> | شناسه های محلی برای جلوگیری از ارسال تکراری |
| hide | خیر | 0/1/Boolean | 1 یا true => عدم نمایش شماره گیرنده در گزارش ها |
| tag | خیر | String | تگ ثبت شده در پنل (فقط حروف/اعداد انگلیسی، - و _ ، حداکثر 200 کاراکتر) |

#### نکات / یادداشت
1. طول سه آرایه اجباری باید برابر باشد؛ در غیر اینصورت خطای 419 (سمت سرور) یا خطای LengthMismatch (سمت کتابخانه) رخ می‌دهد.
2. در صورت تکرار `localmessageids` قبلاً استفاده شده، ارسال جدید انجام نمی‌شود و همان رکورد بازگردانده می‌شود.
3. مقدار `hide=1` شماره گیرنده را در پنل مخفی می‌کند.
4. قبل از استفاده از `tag` باید در پنل تگ ایجاد شود؛ در غیر اینصورت خطا 607.

#### کدهای خطا (منتخب)
| کد | توضیح |
|----|-------|
| 405 | متد غیرمجاز (باید POST باشد) |
| 412 | تعداد گیرندگان بیش از 200 |
| 417 | تاریخ نامعتبر |
| 418 | اعتبار کافی نیست |
| 419 | اندازه آرایه های پیام / گیرنده / ارسال کننده برابر نیست |
| 607 | نام تگ اشتباه است |

## کنترل وضعیت پیامک ها (Status)

پس از ارسال، هر پیامک ابتدا «در صف» قرار می‌گیرد، ظرف کمتر از 1 ثانیه به مخابرات تحویل می‌شود (وضعیت «ارسال به مخابرات») و سپس طی حداکثر چند دقیقه به یکی از وضعیت‌های نهایی جدول وضعیت پیامک‌ها می‌رسد (مثلاً رسیده به گیرنده، نرسیده، مسدود و ...). متد `Status` برای دریافت رسید (Delivery Report) پیام‌ها بر اساس `messageid` استفاده می‌شود.

محدودیت‌ها و نکات کلیدی:

1. در هر فراخوانی حداکثر 500 شناسه مجاز است (بیشتر => خطای 414 یا خطای کتابخانه).
2. فقط می‌توانید وضعیت پیامک‌های 48 ساعت گذشته را دریافت کنید؛ بعد از آن مقدار `status = 100` (معتبر نیست / منقضی) بازگردانده می‌شود.
3. اگر شناسه معتبر نباشد یا مربوط به شما نباشد، وضعیت همان `100` خواهد بود.
4. امکان فعال‌سازی ارسال خودکار وضعیت (Status Callback URL) از بخش تنظیمات خطوط وجود دارد.

### ورودی (CountOutbox)

| پارامتر | وضعیت | نوع | توضیح |
|---------|-------|-----|-------|
| messageid | اجباری | String/Number/Array | شناسه(های) یکتای پیامک، می‌تواند عدد تکی، رشته «کاما جدا» یا آرایه باشد |

کتابخانه انواع زیر را می‌پذیرد و تبدیل می‌کند:

```ts
api.Status({ messageid: 85463238 });
api.Status({ messageid: '85463238,85463239' });
api.Status({ messageid: [85463238, 85463239] });
```

### خروجی نمونه

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        { "messageid": 85463238, "status": 10, "statustext": "رسیده به گیرنده" },
        { "messageid": 85463239, "status": 4,  "statustext": "ارسال به مخابرات" }
    ]
}
```

### TypeScript

```ts
import { KavenegarApi, StatusEntry } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function checkStatus(ids: number[]) {
    const res = await api.Status({ messageid: ids });
    const list: StatusEntry[] = res.entries; // typed
    list.forEach(it => {
        console.log(it.messageid, it.status, it.statustext);
    });
}
checkStatus([85463238, 85463239]);
```

### خطاهای رایج

| کد | توضیح |
|----|-------|
| 400 | پارامتر ناقص (عدم ارسال messageid) |
| 414 | تعداد شناسه‌ها بیش از حد مجاز (بیش از 500) |

در صورت عبور از محدودیت 500 شناسه، کتابخانه پیش از ارسال، خطا با متن `Status request exceeds 500 ids limit` پرتاب می‌کند.

### StatusLocalMessageid

اگر هنگام ارسال از `localid` (یا `localmessageids`) استفاده کرده‌اید، می‌توانید برای دریافت وضعیت، به جای `messageid` از متد زیر بهره ببرید:

```ts
const res = await api.StatusLocalMessageid({ localid: ['loc1','loc2'] });
```

ساختار خروجی مشابه `Status` است با همان فیلدهای `messageid`, `status`, `statustext`.

> توجه: جدول کامل کدهای وضعیت در مستندات رسمی کاوه نگار موجود است؛ برخی کدهای متداول: 1 (در صف)، 4 (ارسال به مخابرات)، 10 (رسیده به گیرنده)، 100 (شناسه نامعتبر/منقضی).

### دریافت وضعیت با شناسه محلی (StatusLocalMessageid / localid)

اگر هنگام ارسال پیامک‌ها پارامتر `localid` (در متد `Send`) یا آرایه `localmessageids` (در متد `SendArray`) را ثبت کرده باشید، می‌توانید بدون دانستن `messageid` وضعیت را از طریق همان شناسه‌های محلی بازیابی کنید.

نکات مهم طبق مستندات رسمی:

1. فقط پیام‌های حداکثر ۱۲ ساعت گذشته توسط `localid` قابل پیگیری هستند (قدیمی‌تر → `status = 100`).
2. در هر فراخوانی حداکثر 500 شناسه مجاز است؛ بیشتر → خطای 414 (کتابخانه پیش از ارسال خطا می‌دهد).
3. اگر در زمان ارسال برای پیامی `localid` تعیین نکرده باشید، در پاسخ استعلام با آن شناسه مقدار `status = 100` (نامعتبر) بازگردانده می‌شود.
4. ساختار پاسخ دقیقاً همانند متد `Status` است (فیلدهای `messageid`, `status`, `statustext`) و ممکن است `localid` هم تکرار شود.
5. فعال‌سازی «ارسال وضعیت به URL» (Status Callback URL) از بخش تنظیمات خطوط همچنان قابل استفاده است.

#### مثال درخواست (REST)

```text
GET https://api.kavenegar.com/v1/{API-KEY}/sms/statuslocalmessageid.json?localid=450
```

#### مثال پاسخ

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        { "messageid": 85463238, "localid": "450", "status": 10, "statustext": "رسیده به گیرنده" }
    ]
}
```

#### استفاده در کتابخانه (JavaScript / TypeScript)

```ts
// Single local id
await api.StatusLocalMessageid({ localid: '450' });

// Comma separated
await api.StatusLocalMessageid({ localid: 'loc1,loc2,loc3' });

// Array form
await api.StatusLocalMessageid({ localid: ['loc1','loc2','loc3'] });
```

#### نکات پردازشی در کتابخانه

کتابخانه به طور خودکار ورودی را نرمال‌سازی می‌کند و در صورت عبور از سقف 500 شناسه خطای زیر را پیش از ارسال درخواست پرتاب می‌کند:

```text
Status request exceeds 500 ids limit
```

#### English Summary

Use `StatusLocalMessageid` when you stored your own `localid` per message and did not (or cannot) persist the generated `messageid`. Constraints: max 500 ids per call, only messages from last 12 hours are retrievable, missing/unknown local ids yield status 100 (invalid/expired). Response shape is identical to `Status`.

## آخرین ارسال ها (LatestOutbox)

این متد فهرست آخرین پیامک‌های ارسالی شما را (حداکثر 500 رکورد) برمی‌گرداند. در حال حاضر قابلیت Pagination در سمت سرویس پیاده‌سازی نشده و همیشه حداکثر همان تعداد آخر برمی‌گردد.

### ورودی

| پارامتر | وضعیت | نوع | توضیح |
|---------|-------|-----|-------|
| pagesize | اختیاری | Number | تعداد رکوردهای درخواستی (۱ تا ۵۰۰). اگر ارسال نشود کتابخانه مقدار 500 را ارسال می‌کند. |
| sender | اختیاری | String | در صورت تعیین، فقط ارسال‌های مربوط به آن خط اختصاصی بازگردانده می‌شود. |

نکات:
1. اگر `pagesize` بزرگ‌تر از ۵۰۰ باشد در مستندات مقدار «نامعتبر» تلقی شده و خطای 400 ممکن است بازگردد؛ کتابخانه قبل از ارسال خطا می‌دهد.
2. برای محدود کردن خروجی به یک خط خاص، پارامتر `sender` را مقداردهی کنید.
3. نیاز به تنظیم IP مجاز در بخش تنظیمات امنیتی پنل دارید (در غیر اینصورت خطای 407).

### خروجی نمونه

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        {
            "messageid": 30034577,
            "message": "خدمات پیام کوتاه کاوه نگار",
            "status": 10,
            "statustext": "رسیده به گیرنده",
            "sender": "30002626",
            "receptor": "09*********",
            "date": 1409533200,
            "cost": 120
        }
    ]
}
```

ساختار هر آیتم دقیقا همان فیلدهای متد `Select` را دارد: `messageid, message, status, statustext, sender, receptor, date, cost`.

### نمونه استفاده (JavaScript)

```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });

api.LatestOutbox({ pagesize: 200 }, function(entries, status, message){
    console.log(status, message);
    console.log(entries.length, 'records');
});
```

### TypeScript / Promise

```ts
import { KavenegarApi, LatestOutboxEntry } from 'kavenegar/dist/kavenegar';

const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function recent() {
    const res = await api.LatestOutbox({ pagesize: 50, sender: '30002626' });
    const list: LatestOutboxEntry[] = res.entries;
    list.forEach(m => {
        console.log(m.messageid, m.status, m.statustext);
    });
}
recent();
```

### اعتبارسنجی سمت کتابخانه

1. اگر `pagesize` مقداردهی نشود کتابخانه مقدار 500 را ارسال می‌کند.
2. اگر `pagesize` خارج از بازه 1..500 باشد خطای `pagesize must be between 1 and 500` پرتاب می‌شود.
3. اگر `pagesize` عدد نباشد خطای `pagesize must be a number` پرتاب می‌شود.

### کدهای خطا (طبق مستند ارائه شده)

| کد | توضیح |
|----|-------|
| 400 | پارامترها ناقص یا نامعتبر (مثلاً pagesize>500) |
| 407 | دسترسی به اطلاعات برای شما امکان پذیر نیست (عدم تنظیم IP مجاز) |
| 412 | ارسال کننده نامعتبر یا متعلق به شما نیست |

### English Summary

Fetch up to the latest 500 sent SMS records. Optional parameters: `pagesize` (1..500, default 500) and `sender` to filter by a specific dedicated line. Response entries contain: `messageid, message, status, statustext, sender, receptor, date, cost`. Requires whitelisted IP; errors: 400 (invalid params), 407 (access denied), 412 (invalid sender).


## تعداد ارسال ها (CountOutbox)

این متد برای دریافت تعداد پیامک های ارسالی شما در یک بازه زمانی کوتاه استفاده می‌شود و آمار تجمیعی صفحات (segments) و تعداد پیام‌ها و هزینه را بازمی‌گرداند.

### ورودی

| پارامتر | وضعیت | نوع | توضیح |
|---------|-------|-----|-------|
| startdate | اجباری | UnixTime (sec) | تاریخ شروع بازه (حداکثر 4 روز قبل از الان) |
| enddate | اختیاری | UnixTime (sec) | تاریخ پایان بازه؛ اگر خالی ارسال شود تا «اکنون» در نظر گرفته می‌شود |
| status | اختیاری | Number | فیلتر بر اساس وضعیت تحویل پیامک (مثلاً 1=در صف، 10=رسیده) |

### محدودیت ها / اعتبارسنجی (CountOutbox)
1. `startdate` باید عدد معتبر ثانیه یونیکس و حداکثر 4 روز قبل باشد؛ در غیر اینصورت خطا پرتاب می‌شود.
2. اگر `enddate` مقداردهی شود باید: (الف) عدد معتبر باشد (ب) از `startdate` کوچکتر نباشد (ج) اختلاف آن با `startdate` از 86400 ثانیه (1 روز) بیشتر نباشد.
3. اگر `enddate` ارسال نشود، کتابخانه برای کنترل بازه فرض را بر «اکنون» گذاشته و اگر فاصله بیش از 1 روز باشد خطا می‌دهد.
4. اگر `status` ارسال شود باید عدد معتبر باشد (Number.isFinite).

خطای سرور مستند شده: 417 (تاریخ نامعتبر یا تاریخ پایان کوچکتر از آغاز).

### خروجی نمونه (CountOutbox)

```json
{
    "return": { "status": 200, "message": "تایید شد" },
    "entries": [
        {
            "startdate": 1409533200,
            "enddate": 1409533200,
            "sumpart": 45000,
            "sumcount": 15000,
            "cost": 5175000
        }
    ]
}
```

### فیلدهای خروجی

| فیلد | نوع | توضیح |
|------|-----|-------|
| startdate | Long | تاریخ شروع (یونیکس) |
| enddate | Long | تاریخ پایان (یا مساوی startdate در صورتی که بازه یک نقطه ای باشد) |
| sumpart | Long | مجموع تعداد صفحات (segments) پیامک ها |
| sumcount | Long | تعداد کل پیامک های ارسالی (logical messages) |
| cost | Long | مجموع هزینه پیامک های ارسالی (ریال)؛ برابر است با `sumpart * تعرفه` |

### نکات (CountOutbox)

1. حداکثر فاصله زمانی بین `startdate` و `enddate` یک روز است.
2. `startdate` نمی تواند بیش از 4 روز قبل باشد.
3. برای دریافت آمار از یک تاریخ تا همین لحظه `enddate` را خالی بگذارید.
4. اگر فقط آمار پیامک های در صف را می‌خواهید `status=1` بفرستید.
5. اگر `enddate < startdate` باشد یا تاریخ ها نامعتبر باشند خطای 417 بازگردانده می‌شود (کتابخانه پیش از ارسال نیز خطا می‌دهد).

### مثال استفاده (JavaScript)

```js
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({ apikey: 'your-api-key' });

api.CountOutbox({ startdate: 1409533200, enddate: 1409570000, status: 10 }, function(entries, status, message){
    console.log(status, message);
    console.log(entries);
});
```

### TypeScript / Promise (CountOutbox)

```ts
import { KavenegarApi, CountOutboxEntry } from 'kavenegar/dist/kavenegar';
const api = new KavenegarApi({ apikey: process.env.KAVENEGAR_API_KEY! });

async function stats(){
    const res = await api.CountOutbox({ startdate: Math.floor(Date.now()/1000) - 3600 }); // last hour until now
    const rows: CountOutboxEntry[] = res.entries;
    if (rows.length) {
        const r = rows[0];
        console.log('Parts:', r.sumpart, 'Messages:', r.sumcount, 'Cost:', r.cost);
    }
}
stats();
```

### English Summary (CountOutbox)

Returns aggregate counts for sent SMS within a short window: startdate (required), optional enddate (else now), optional status filter. Constraints: startdate not older than 4 days, max span 1 day, enddate >= startdate. Response: array with one entry containing startdate, enddate, sumpart (total segments), sumcount (logical messages), cost (rial). Error 417 for invalid dates.



## Contribution

Bug fixes, docs, and enhancements welcome! Please let us know <a href="mailto:support@kavenegar.com?Subject=SDK" target="_top">support@kavenegar.com</a>
<hr>
<div dir='rtl'>
	
## راهنما

### معرفی سرویس کاوه نگار

کاوه نگار یک وب سرویس ارسال و دریافت پیامک و تماس صوتی است که به راحتی میتوانید از آن استفاده نمایید.

### ساخت حساب کاربری

اگر در وب سرویس کاوه نگار عضو نیستید میتوانید از [لینک عضویت](http://panel.kavenegar.com/client/membership/register) ثبت نام  و اکانت آزمایشی برای تست API دریافت نمایید.

### مستندات

برای مشاهده اطلاعات کامل مستندات [وب سرویس پیامک](http://kavenegar.com/وب-سرویس-پیامک.html)  به صفحه [مستندات وب سرویس](http://kavenegar.com/rest.html) مراجعه نمایید.

### راهنمای فارسی

در صورتی که مایل هستید راهنمای فارسی کیت توسعه کاوه نگار را مطالعه کنید به صفحه [کد ارسال پیامک](http://kavenegar.com/sdk.html) مراجعه نمایید.

### اطالاعات بیشتر
برای مطالعه بیشتر به صفحه معرفی
[وب سرویس اس ام اس ](http://kavenegar.com)
کاوه نگار
مراجعه نمایید .

 اگر در استفاده از کیت های سرویس کاوه نگار مشکلی یا پیشنهادی  داشتید ما را با یک Pull Request  یا  ارسال ایمیل به support@kavenegar.com  خوشحال کنید.
 
##
![http://kavenegar.com](http://kavenegar.com/public/images/logo.png)		

[http://kavenegar.com](http://kavenegar.com)	

</div>




