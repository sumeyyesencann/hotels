# SE 4458 Final Sunum Scripti — Hotels.com Benzeri Rezervasyon Sistemi

---

## 1. AÇILIŞ (30 saniye)

"Merhaba, ben Sümeyye Şencan, Grup 1. Bugün Hotels.com benzeri bir otel rezervasyon sistemi sunacağım. Sistem, birbirinden bağımsız 5 backend servisi ve bir API gateway'den oluşuyor. Her servis kendi portunda çalışıyor, bağımsız deploy edilebiliyor ve ayrı bir sorumluluk üstleniyor. Şimdi önce canlı sistemi göstereyim, sonra kodu açıklayayım."

---

## 2. MİMARİ TANITIM (1 dakika)

"Sistemin mimarisini özetleyeyim. Elimizde şu servisler var:

| Servis               | Port | Sorumluluk                              |
|----------------------|------|-----------------------------------------|
| API Gateway          | 3000 | Tek giriş noktası, tüm trafiği yönlendirir |
| hotel-service        | 3001 | Otel arama, detay, rezervasyon, admin   |
| comments-service     | 3002 | Yorum yazma ve listeleme (MongoDB)      |
| ai-agent-service     | 3003 | AI chatbot, OpenAI function calling     |
| notification-service | 3004 | Kapasite uyarısı, RabbitMQ consumer     |
| Frontend (React)     | 5173 | Kullanıcı arayüzü                       |

Kullanıcı sadece gateway'in URL'ini görüyor — hangi servisin cevap verdiğini bilmiyor. Gateway, isteğin path'ine göre ilgili servise proxy'liyor. Örneğin `/api/v1/hotels` → hotel-service:3001, `/api/v1/comments` → comments-service:3002 gibi."

---

## 3. TEKNOLOJİ SEÇİMLERİ (1 dakika)

"Neden bu teknolojileri seçtik, kısaca açıklayayım:

- **Supabase (PostgreSQL + Auth)**: Hem veritabanı hem JWT tabanlı kimlik doğrulama sağlıyor. Kullanıcılar kayıt olduğunda Supabase Auth bir JWT token üretiyor, bunu her backend servisi kendi başına doğrulayabiliyor.

- **MongoDB Atlas**: Yorumlar yapısal olmayan veri olduğu için ve esnek schema gerektiği için NoSQL tercih ettik. comments-service sadece MongoDB ile konuşuyor.

- **Upstash Redis**: Otel arama sonuçlarını 5 dakika cache'liyoruz. Aynı arama tekrar geldiğinde veritabanına gitmeden Redis'ten dönüyor — bu cache-aside pattern.

- **CloudAMQP (RabbitMQ)**: Rezervasyon oluşturulduğunda hotel-service, `new_reservations` kuyruğuna mesaj atıyor. notification-service bu mesajı async olarak tüketiyor. Servisler birbirini beklemek zorunda kalmıyor.

- **OpenAI GPT-4o-mini**: AI chatbot için function calling kullanıyoruz. Model hangi fonksiyonu çağıracağını kendisi kararlaştırıyor — `search_hotels`, `get_hotel_details` gibi.

- **Docker**: Her servis için multi-stage Dockerfile yazdık. Frontend için node:20-alpine ile build, sonra nginx:alpine ile serve ediyoruz."

---

## 4. FRONTEND DEMO (2 dakika)

### 4a. Ana Sayfa & Arama
"Ana sayfada arama formu var. Şehir, giriş-çıkış tarihi ve misafir sayısı giriyoruz. Şu an giriş yapmadan arıyorum — fiyatlar tam fiyat gösteriyor."

*[İstanbul, tarih gir, Ara'ya bas]*

"Sonuçlar geldi. Otel kartlarında fiyat görünüyor. Şimdi giriş yapayım."

### 4b. Giriş & Üye Fiyatı
*[Giriş yap]*

"Giriş yaptıktan sonra aynı aramayı yaparsam backend, JWT token'ı decode ediyor, kullanıcının giriş yaptığını anlıyor ve fiyatlara otomatik %15 indirim uyguluyor. Bunu backend'de search.js'de görüyoruz — `isLoggedIn` true ise `price_per_night * 0.85` yapılıyor."

### 4c. Otel Detay & Yorum
*[Bir otele tıkla]*

"Otel detay sayfasında harita var — Leaflet.js ile OpenStreetMap kullanıyoruz, API key gerektirmiyor. Yorum bölümünde daha önce yazılmış yorumlar listeleniyor, yıldız dağılımını gösteren bir Recharts bar chart var. Yorum yazabilirim."

### 4d. Rezervasyon
*[Rezervasyon yap]*

"Rezervasyon oluştururken hotel-service iki şey yapıyor: önce `available_rooms`'u 1 azaltıyor — bu optimistic locking mantığıyla yapılıyor, aynı anda iki kullanıcı aynı odayı alamasın diye. Sonra RabbitMQ'ya mesaj atıyor."

*[Rezervasyonlarım sayfasına git]*

"Rezervasyonlarım sayfasında yapılan tüm rezervasyonlar listeleniyor. Cancel edebiliyoruz, cancel edilince kapasite geri artıyor."

### 4e. AI Chatbot
*[Chatbot ikonuna tıkla]*

"Bu AI asistan OpenAI GPT-4o-mini kullanıyor. 'İstanbul'da 2 kişilik oda ara' diyorum."

*[mesajı gönder]*

"Model, function calling ile `search_hotels` fonksiyonunu çağırmaya karar veriyor. Biz bu fonksiyonu çalıştırıp sonucu modele geri veriyoruz, model de doğal dilde cevaplıyor."

---

## 5. ADMİN PANEL DEMO (1 dakika)

*[Admin hesabıyla giriş yap, /admin'e git]*

"Admin panelinde otel ekleme formu var. Şehir, açıklama, yıldız, amenities, görsel URL giriyoruz. Oda ekleyebiliyoruz — oda tipi, kapasite, fiyat, toplam oda sayısı."

*[Otelleri Yönet butonuna bas]*

"Bu sayfada tüm oteller listeleniyor. Bir otele tıklayınca admin detay sayfasına gidiyoruz — otel bilgilerini düzenleyebiliyoruz, oda ekleyip silebiliyoruz, oteli tamamen silebiliyoruz."

---

## 6. KAPASİTE BİLDİRİMİ DEMO (1 dakika)

"Notification service'in kapasite uyarısını göstereyim. Bu servis her gece 00:00'da node-cron ile çalışıyor. Kapasitesi %20'nin altına düşmüş odaları tespit edip uyarı üretiyor."

*[Terminalde veya Postman'de]*
```
curl -X POST https://hotels-notification.onrender.com/trigger/capacity-check
```

"Bu endpoint sadece test için — normal akışta cron job otomatik tetikliyor. Görüyoruz ki şu oteller düşük kapasite uyarısı veriyor: [sonucu göster]. Gerçek sistemde bu uyarı e-posta veya Slack'e gönderilebilir."

---

## 7. KOD AÇIKLAMASI — SERVİS SERVİS (3 dakika)

### gateway/ — Port 3000
```
backend/gateway/src/index.js
```
"Gateway'de `http-proxy-middleware` kullanıyoruz. Her path prefix için farklı bir target URL tanımlı. `/api/v1/hotels` → hotel-service, `/api/v1/comments` → comments-service, `/api/v1/ai` → ai-agent-service, `/api/v1/notifications` → notification-service. İstek geldiğinde gateway Authorization header'ı olduğu gibi taşıyor, her servis kendi auth middleware'iyle token'ı doğruluyor."

### hotel-service/ — Port 3001
```
backend/hotel-service/src/routes/search.js
backend/hotel-service/src/routes/reservations.js
backend/hotel-service/src/routes/admin.js
backend/hotel-service/src/middleware/auth.js
```
"En büyük servis bu. `search.js`'de Supabase query'sinde `rooms!inner()` ile join yapıyoruz — sadece uygun odası olan oteller geliyor. Redis cache-aside burada: aynı arama parametreleri için 5 dakika cache var. `reservations.js`'de `available_rooms`'u azaltırken Supabase'in `rpc` veya update+check pattern'i kullanılıyor. `auth.js` middleware'i JWT token'ı Supabase üzerinden doğruluyor."

### comments-service/ — Port 3002
```
backend/comments-service/src/routes/comments.js
backend/comments-service/src/models/Comment.js
```
"Bu servis tamamen bağımsız — kendi MongoDB bağlantısı var. Mongoose model'inde `hotelId`, `userId`, `rating`, `text` alanları var. GET endpoint hotel ID'ye göre yorumları getiriyor, POST yeni yorum ekliyor. Diğer servisler bu servisten habersiz."

### ai-agent-service/ — Port 3003
```
backend/ai-agent-service/src/index.js
```
"OpenAI'a gönderdiğimiz `tools` dizisinde `search_hotels` ve `get_hotel_details` fonksiyonları tanımlı. Model cevap verirken `tool_calls` dönerse, biz o fonksiyonu çalıştırıp sonucu `role: 'tool'` mesajı olarak modele geri gönderiyoruz. Model bu sonuçla doğal dil cevabı üretiyor."

### notification-service/ — Port 3004
```
backend/notification-service/src/consumer/reservationConsumer.js
backend/notification-service/src/scheduler/capacityCheck.js
```
"İki sorumluluğu var: biri RabbitMQ'dan `new_reservations` mesajlarını tüketmek — `amqplib` ile CloudAMQP'ye bağlanıyor, channel açıyor, mesaj geldiğinde işliyor. İkincisi `node-cron` ile `0 0 * * *` — her gece gece yarısı tüm otellerin odalarını tarayıp `available_rooms / total_rooms < 0.20` olanları buluyor."

### frontend/ — Port 5173
```
frontend/src/App.jsx
frontend/src/context/ToastContext.jsx
frontend/src/hooks/useAuth.js
frontend/src/pages/
```
"React + Vite. `useAuth` hook'u Supabase session'ını dinliyor — `onAuthStateChange` ile kullanıcı giriş/çıkış yapınca tüm uygulama güncelleniyor. `ToastContext` global bildirim sistemi — herhangi bir component'ten `showToast('mesaj')` çağrısıyla kullanılıyor. Tüm API çağrıları `src/api/axios.js`'de tanımlı axios instance üzerinden gidiyor, bu instance token'ı header'a otomatik ekliyor."

---

## 8. DOCKER & DEPLOYMENT (45 saniye)

"Her servis için ayrı Dockerfile yazdık. Hepsi multi-stage build — önce dependency install, sonra production image. Frontend'de özellikle: ilk stage'de `npm run build` ile Vite bundle'ı oluşturuyoruz, ikinci stage'de sadece nginx:alpine ile statik dosyaları serve ediyoruz. Böylece final image içinde Node.js yok, çok daha küçük.

Render.com'da 6 ayrı servis olarak deploy ettik:
- 5 backend servisi Web Service olarak
- Frontend Static Site olarak

Her servisin kendi environment variable'ları var, birbirinin secretlarını bilmiyor."

---

## 9. VERİTABANI ŞEMASI (30 saniye)

"Supabase'de şu tablolar var:
- `users` — auth.users ile senkron, profil bilgileri
- `hotels` — otel bilgileri, koordinatlar, amenities (array)
- `rooms` — otele ait odalar, kapasite, fiyat, müsaitlik tarihleri
- `reservations` — kullanıcı + oda + tarih + fiyat + durum

Row Level Security aktif — kullanıcılar sadece kendi rezervasyonlarını görebiliyor. Admin rolü için `is_admin` flag'i `public.users` tablosunda."

---

## 10. KAPANIŞ (15 saniye)

"Özetle: 5 bağımsız microservice, her biri kendi portunda çalışıyor ve bağımsız deploy edilebiliyor. PostgreSQL + MongoDB + Redis + RabbitMQ + OpenAI'ı bir arada kullandık. Sistem Render.com'da canlıda. Sorularınızı bekliyorum."

---

## HIZLI REFERANS — SORU GELİRSE

**"Neden microservice?"**
→ Her servis bağımsız scale edilebilir, deploy edilebilir. comments-service çöküse diğerleri çalışmaya devam eder.

**"Neden Redis?"**
→ Arama sorguları pahalı (join + filter). Aynı parametrelerle 5 dakika içinde gelen istekleri DB'ye sormadan cevaplıyoruz.

**"Neden RabbitMQ?"**
→ Rezervasyon oluşturma senkron bir işlem — kullanıcı hemen cevap almalı. Bildirim async olabilir, kuyruğa bırakıyoruz.

**"Optimistic locking nedir?"**
→ `available_rooms > 0` kontrol edip, aynı transaction'da 1 azaltıyoruz. Supabase bu update'i atomik yapıyor.

**"JWT nasıl çalışıyor?"**
→ Supabase Auth token üretiyor. Her servisin middleware'i bu token'ı Supabase public key ile verify ediyor, DB'ye gitmiyor.
