# kavenegar-node


# <a href="http://kavenegar.com/rest.html">Kavenegar RESTful API Document</a>
If you need to future information about API document Please visit RESTful Document

## Installation
<p>
First of all, You need to make an account on Kavenegar from <a href="https://panel.kavenegar.com/Client/Membership/Register">Here</a>
</p>
<p>
After that you just need to pick API-KEY up from <a href="http://panel.kavenegar.com/Client/setting/index">My Account</a> section.
You can download the Node SDK <a href="https://github.com/KaveNegar/kavenegar-node.git">Here</a> or just pull it.
Anyway there is good tutorial about <a href="http://gun.io/blog/how-to-github-fork-branch-and-pull-request/">Pull  request</a>
</p>
<p> For installing Kavenegar  use this command via npm </p>

```node
npm install kavenegar
```


If you don't have npm you can easily install it from  [npm website](https://www.npmjs.com/)


## Usage

Well, There is examples to Send SMS by node below.

Simple Send:
```node
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({
    apikey: 'your apikey here'
});
api.Send({
        message: "خدمات پیام کوتاه کاوه نگار",
        sender: "10004346",
        receptor: "09123456789,09367891011",
        // زمان‌بندی ارسال (یونیکس تایم – اختیاری)
        // date: 1734000000,
        // شناسه محلی برای جلوگیری از ارسال تکراری (به تعداد گیرنده ها)
        // localid: "id1,id2",
        // مخفی کردن شماره گیرنده در گزارش ها
        hide: 1,
        // تگ تحلیلی تعریف شده در پنل
        tag: "register-flow"
    },
    function(response, status) {
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
    "entries": 
    [
        {
            "messageid":8792343,
            "message":"خدمات پیام کوتاه کاوه نگار",
            "status":1,
            "statustext":"در صف ارسال",
            "sender":"10004346",
            "receptor":"09123456789",
            "date":1356619709,
            "cost":120
        },
        {
            "messageid":8792344,
            "message":"خدمات پیام کوتاه کاوه نگار",
            "status":1,
            "statustext":"در صف ارسال",
            "sender":"10004346",
            "receptor":"09367891011",
            "date":1356619709,
            "cost":120
        }
    ]
}
*/
```

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

### ورودی

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




