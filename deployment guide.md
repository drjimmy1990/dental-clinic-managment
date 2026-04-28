# دليل النشر والاستضافة على الخادم الشخصي (VPS Deployment Guide)

هذا الدليل يشرح خطوة بخطوة كيفية رفع وتشغيل نظام **DentaCare Pro** المبرمج بـ (Next.js) على خادمك الخاص (VPS) بنظام Ubuntu.

---

## 1. المتطلبات الأساسية (Prerequisites)
تأكد من أن خادمك (VPS) يحتوي على البرامج التالية مثبتة مسبقاً (سواء يدوياً أو عبر لوحة تحكم مثل aaPanel/CyberPanel):
- **Node.js** (إصدار 18 أو أحدث)
- **NPM** (مدير الحزم)
- **Git** (لجلب الكود من المستودع)
- **PM2** (لإبقاء التطبيق يعمل في الخلفية) -> التثبيت: `npm install -g pm2`
- **Nginx** (لربط الدومين الخاص بك بالتطبيق)

---

## 2. سحب الكود وإعداده (Setup & Clone)

قم بتسجيل الدخول إلى خادمك عبر الـ SSH واتبع الخطوات:

```bash
# 1. اذهب لمجلد المشاريع (أو أي مسار تفضله)
cd /var/www

# 2. اسحب الكود من المستودع الخاص بك (GitHub/GitLab)
git clone https://github.com/drjimmy1990/dental-clinic-managment.git

# 3. ادخل لمجلد المشروع
cd dental-clinic-managment

# 4. قم بتثبيت الحزم البرمجية
npm install
```

---

## 3. إعداد متغيرات البيئة (Environment Variables)

تحتاج إلى إنشاء ملف `.env.local` أو `.env` في الخادم ووضع مفاتيح **Supabase** بداخله لتتصل بقاعدة البيانات.

```bash
nano .env.local
```

انسخ والصق المفاتيح الخاصة بك في الملف:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```
*(احفظ الملف بالضغط على `Ctrl+O` ثم `Enter` ثم `Ctrl+X` للخروج)*

---

## 4. بناء المشروع (Build)

الآن، يجب تحويل كود التطوير إلى كود جاهز للإنتاج (Production):

```bash
npm run build
```
*(هذه العملية قد تستغرق بضع دقائق، تأكد من عدم ظهور أي أخطاء)*

---

## 5. تشغيل النظام عبر PM2 (Run in Background)

يستخدم PM2 لضمان استمرار عمل التطبيق حتى بعد إغلاق شاشة الـ SSH، وإعادة تشغيله تلقائياً إذا أعيد تشغيل السيرفر.

```bash
# تشغيل التطبيق وإعطاؤه اسم dentacare
pm2 start npm --name "dentacare" -- run start

# لحفظ الإعدادات لتعمل مع إعادة تشغيل السيرفر تلقائياً
pm2 save
pm2 startup
```

> [!TIP]
> إذا أردت رؤية لوحة تحكم PM2 ومراقبة الأداء، استخدم الأمر: `pm2 monit`

---

## 6. إعداد الدومين و Nginx (Reverse Proxy)

التطبيق الآن يعمل على المنفذ `3000` (أي `http://localhost:3000`). لتجعله يعمل عبر الدومين الخاص بك (مثلاً `clinic.com`)، يجب ضبط Nginx.

افتح ملف إعدادات Nginx الخاص بالدومين:
```bash
sudo nano /etc/nginx/sites-available/dentacare
```

أضف الإعدادات التالية (مع تغيير `your-domain.com` للدومين الحقيقي):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

قم بتفعيل الإعدادات وإعادة تشغيل Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/dentacare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. شهادة الحماية SSL (HTTPS)
يفضل دائماً تشغيل النظام عبر HTTPS. استخدم Certbot المجاني:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## استكشاف الأخطاء وإصلاحها (Troubleshooting)

- **السيرفر لا يقرأ متغيرات البيئة:** تأكد من إضافتها لملف `.env.local` وقم بإعادة البناء `npm run build` ثم أعد التشغيل `pm2 restart dentacare`.
- **خطأ 502 Bad Gateway:** يعني أن تطبيق Next.js غير يعمل. استخدم الأمر `pm2 logs dentacare` لمعرفة الخطأ.
- **تحديث النظام لاحقاً:** عندما تقوم بتعديل الكود مستقبلاً، قم بالتالي:
  ```bash
  git pull
  npm install
  npm run build
  pm2 restart dentacare
  ```

🎉 **النظام الآن يعمل وجاهز لاستقبال المستخدمين والمرضى!**
