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



Send Array:

```node
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({
    apikey: 'your-apikey'
});
api.SendArray(
{
        message: '["کاوه نگار", "وب سرویس کاوه نگار"]',
        sender: '["10008445","10008445"]',
        receptor: '["09123456789","09123456781"]'
}
,
    function(response, status) {
        console.log(response);
        console.log(status);
});
```
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




