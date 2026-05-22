# DEMO PLANI — Hotels.com Klonu

> **Süre:** ~15 dakika
> **Tarayıcı sekmeleri hazırla:** Frontend, Supabase, Render Dashboard, GitHub repo, VS Code

---

## HAZIRLIK (Demo öncesi)

- [ ] Frontend açık: https://hotels-frontend-mip8.onrender.com
- [ ] Supabase Dashboard açık (Hotels projesi)
- [ ] Render Dashboard açık (My project)
- [ ] CloudAMQP Dashboard açık
- [ ] VS Code'da proje açık
- [ ] İki tarayıcı sekmesi: biri admin (`sumeyyesencan1@gmail.com`), biri normal user (`sumeyyesencan1@icloud.com`)
- [ ] Çıkış yap, demoya anonim olarak başla

---

## BÖLÜM 1 — AÇILIŞ & MİMARİ (2 dakika)

### Adım 1.1: Tanıtım
**Ekran:** VS Code, proje dosya yapısı açık (sol panelde backend/ klasörü genişletilmiş)

**Söyle:**
> "Merhaba, ben Sümeyye Şencan, Grup 1. Hotels.com benzeri bir otel rezervasyon sistemi yaptım.
>
> Sistem **5 bağımsız backend microservice** ve **bir API gateway**'den oluşuyor. Her servis kendi portunda çalışıyor, kendi sorumluluğu var ve bağımsız deploy edilebiliyor."

**Ekranı göster:** `backend/` klasörü altındaki 5 klasör + gateway

### Adım 1.2: Mimari Açıkla
**Söyle:**
> "Servislerin portları şöyle:
> - **Gateway:** 3000 — tek giriş noktası
> - **hotel-service:** 3001 — otel arama, rezervasyon, admin
> - **comments-service:** 3002 — yorumlar (MongoDB)
> - **ai-agent-service:** 3003 — AI chatbot
> - **notification-service:** 3004 — kapasite uyarısı + RabbitMQ consumer
> - **Frontend:** React + Vite
>
> Kullanıcı sadece gateway URL'ini görüyor. Gateway, path'e göre ilgili servise proxy'liyor."

**Ekranı göster:** `backend/gateway/src/index.js`
- Söyle: "Gördüğünüz gibi `http-proxy-middleware` ile her path prefix farklı servise yönlendiriliyor."

---

## BÖLÜM 2 — FRONTEND DEMO (3 dakika)

### Adım 2.1: Ana Sayfa (Anonim)
**Ekran:** Frontend ana sayfa, **çıkış yapılmış**

**Söyle:**
> "Şu an giriş yapmadan kullanıyorum. Ana sayfada arama formu var: şehir, tarih, misafir sayısı."

**Yap:**
- Şehir: `İzmir`
- Giriş: `07/07/2026`
- Çıkış: `09/07/2026`
- Misafir: `2`
- **Ara**'ya bas

### Adım 2.2: Arama Sonuçları
**Ekran:** Arama sonuçları sayfası, Sumeyye Otel görünüyor

**Söyle:**
> "Sumeyye Otel geldi, gecelik 3000 TL. Şu an giriş yapmadığım için TAM fiyat görüyorum.
>
> Backend tarafında `hotel-service`'in `search.js` dosyasında **Redis cache-aside pattern** uyguladım. Aynı arama 5 dakika içinde tekrar yapılırsa veritabanına gitmeden Redis'ten dönüyor."

**Ekranı göster (VS Code):** `backend/hotel-service/src/routes/search.js`
- Cache key satırını göster: `const cacheKey = \`search:${city}:...\``

### Adım 2.3: Harita
**Söyle:**
> "Haritada Göster'e bastığımda Leaflet.js + OpenStreetMap kullanılıyor. API key gerektirmiyor, ücretsiz."

**Yap:** Haritada Göster'e bas, otelin pin'ini göster

### Adım 2.4: Otel Detay
**Yap:** Sumeyye Otel'e tıkla

**Söyle:**
> "Otel detay sayfasında bilgiler, oda listesi, harita, ve yorumlar var. Yorumlar **MongoDB Atlas**'ta tutuluyor — yorumlar yapısal olmayan veri olduğu için NoSQL tercih ettim. comments-service tamamen bağımsız bir servis, kendi MongoDB bağlantısı var."

**Ekranı göster:** Yorum bölümü ve Recharts dağılım grafiği

### Adım 2.5: Giriş Yap & İndirim Göster
**Yap:**
- Sağ üstte **Giriş Yap**'a bas
- `sumeyyesencan1@gmail.com` ile giriş yap
- Ana sayfaya dön, aynı aramayı tekrar yap

**Söyle:**
> "Şimdi giriş yaptım. Aynı aramayı tekrar yapıyorum...
>
> Görüyorsunuz fiyat **2550 TL** oldu, yani **%15 indirim** uygulandı. Bu mantık backend'de: kullanıcı giriş yapmışsa fiyat 0.85 ile çarpılıyor."

**Ekranı göster:** `search.js`'te indirim mantığı
```javascript
display_price: isLoggedIn ? price_per_night * 0.85 : price_per_night
```

---

## BÖLÜM 3 — REZERVASYON & RABBITMQ (2 dakika)

### Adım 3.1: Rezervasyon Yap
**Yap:**
- Otel detaya gir
- Bir oda seç → **Rezervasyon Yap**
- Onayla

**Söyle:**
> "Rezervasyon oluşturuldu. Şimdi arka planda iki şey oldu:
> 1. `hotel-service`, `available_rooms`'u 1 azalttı — bu **atomik update** ile, aynı anda iki kullanıcı aynı odayı alamasın diye.
> 2. **CloudAMQP** RabbitMQ kuyruğuna `new_reservations` mesajı atıldı."

### Adım 3.2: CloudAMQP Kuyruk Göster
**Ekran:** CloudAMQP dashboard → Queues sekmesi

**Söyle:**
> "Burada CloudAMQP dashboard'u. `new_reservations` kuyruğunu görüyorsunuz, mesajlar buraya düşüyor. **notification-service** bu kuyruğu dinleyen consumer'a sahip — mesaj geldiğinde async olarak işliyor. Senkron bekleme yok."

**Ekranı göster (VS Code):** `backend/notification-service/src/queue/consumer.js`

### Adım 3.3: Rezervasyonlarım
**Yap:** Üstten **Rezervasyonlarım**'a tıkla

**Söyle:**
> "Yapılan rezervasyonlar burada listeleniyor. İptal edilirse kapasite geri artıyor."

---

## BÖLÜM 4 — AI CHATBOT (2 dakika)

### Adım 4.1: AI Aç
**Yap:** Sağ alttaki AI asistan ikonuna tıkla

**Söyle:**
> "Sağ alttaki AI asistan **OpenAI GPT-4o-mini** kullanıyor. **Function calling** yaklaşımı ile çalışıyor — model hangi fonksiyonu çağıracağına kendi karar veriyor."

### Adım 4.2: Doğal Dil ile Arama
**Yap:** Şunu yaz:
> "Bana İzmir'de 7-9 Temmuz için 2 kişilik otel bul"

**Söyle (cevap gelirken):**
> "Model 'search_hotels' fonksiyonunu çağırdı. Ben bu fonksiyonu kendi backend'imde tanımladım, gerekli parametreleri model JSON formatında üretti. Sonucu modele geri verdim, model doğal dilde cevap üretti."

**Ekranı göster (VS Code):** `backend/ai-agent-service/src/agent/tools.js`
- `search_hotels` tool tanımını göster

**Ekranı göster:** `chat.js`'te tool_calls döngüsü

---

## BÖLÜM 5 — ADMİN PANEL (2 dakika)

### Adım 5.1: Admin Paneli Aç
**Yap:**
- Sağ üstte **Admin Panel**'e tıkla (admin kullanıcısıyla giriş yapmış olmalı)

**Söyle:**
> "Admin panelinde yeni otel ekleyebiliyorum, oda ekleyebiliyorum.
>
> Backend tarafında admin yetkisi `hotel_admins` tablosundan kontrol ediliyor. JWT token'dan kullanıcı ID'sini alıyorum, sonra Supabase'de bu tabloyu sorguluyorum."

**Ekranı göster (VS Code):** `backend/hotel-service/src/middleware/auth.js`
- `requireAdmin` fonksiyonunu göster

### Adım 5.2: Otelleri Yönet
**Yap:** **Otelleri Yönet** butonuna bas

**Söyle:**
> "Buradan tüm oteller listeleniyor. Bir otele tıklayınca admin detay sayfası geliyor — düzenleme, silme, oda yönetimi."

**Yap:** Bir otele tıkla, AdminHotelDetail sayfasını göster

### Adım 5.3: Görsel Yükleme
**Söyle:**
> "Otel görselleri **Supabase Storage**'a yükleniyor. Bu Supabase'in dosya depolama servisi."

---

## BÖLÜM 6 — NOTIFICATION SERVICE (1.5 dakika)

### Adım 6.1: Cron Görevini Anlat
**Ekran:** VS Code → `backend/notification-service/src/scheduler/capacityCheck.js`

**Söyle:**
> "notification-service'in iki sorumluluğu var:
> 1. **Cron job**: Her gece 00:00'da çalışıyor (`0 0 * * *`). Tüm otellerin odalarını tarıyor, **available_rooms / total_rooms < %20** olanları tespit edip uyarı üretiyor.
> 2. **RabbitMQ consumer**: Az önce gösterdim, `new_reservations` kuyruğunu dinliyor."

### Adım 6.2: Manuel Tetikle
**Yap:** Terminal aç, şunu çalıştır:
```bash
curl -X POST https://hotels-notification.onrender.com/trigger/capacity-check
```

**Söyle (sonuç gelirken):**
> "Bu endpoint sadece demo için. Normalde cron tetikliyor. Görüyorsunuz, düşük kapasiteli odaların uyarısı dönüyor."

---

## BÖLÜM 7 — VERİTABANI & BACKEND TURU (2 dakika)

### Adım 7.1: Supabase Tabloları
**Ekran:** Supabase → Table Editor

**Söyle:**
> "**Supabase** PostgreSQL kullanıyorum. Şu tablolar var:
> - `hotels` — otel bilgileri, koordinatlar, amenities array
> - `rooms` — oda tipleri, kapasiteler, fiyatlar, müsaitlik tarihleri
> - `reservations` — kullanıcı + oda + tarih + fiyat
> - `hotel_admins` — admin yetkili kullanıcılar
> - `users` — auth.users mirror'ı
>
> Auth'u da Supabase yapıyor — JWT token üretip frontend'e veriyor. Backend her servisi bu token'ı kendi başına doğruluyor."

### Adım 7.2: MongoDB Atlas
**Ekran:** MongoDB Atlas → comments collection

**Söyle:**
> "Yorumlar MongoDB Atlas'ta. Her döküman: hotel_id, user_id, rating, text. NoSQL şeması esnek olduğu için yorumların yıldız dağılımı gibi alt yapılar kolayca eklenebiliyor."

### Adım 7.3: Upstash Redis
**Ekran:** Upstash dashboard

**Söyle:**
> "Upstash Redis cache için. HTTP tabanlı REST API kullanıyor — Render'ın free tier kısıtlamalarıyla problem yaşamıyor. Arama cache key'leri şöyle: `search:İstanbul:2026-07-07:2026-07-09:2:1`"

---

## BÖLÜM 8 — DOCKER & DEPLOYMENT (1.5 dakika)

### Adım 8.1: Dockerfile Göster
**Ekran:** VS Code → `frontend/Dockerfile`

**Söyle:**
> "Her servis için ayrı Dockerfile var. Frontend için özellikle ilginç:
> **Multi-stage build**: İlk stage `node:20-alpine` ile Vite build yapıyor. İkinci stage'de sadece `nginx:alpine` ile statik dosyaları serve ediyor. Final image'da Node.js yok, çok küçük."

### Adım 8.2: Render Dashboard
**Ekran:** Render Dashboard → My project

**Söyle:**
> "Render.com'da 6 servis canlıda:
> - 5 Web Service (Node.js backend)
> - 1 Static Site (frontend)
>
> Her servisin kendi environment variable'ları var, birbirinin secret'larını bilmiyor. Microservice mantığının canlı uygulaması."

**Ekranı göster:** Servislerin "Deployed" status'ünü göster

---

## BÖLÜM 9 — KAPANIŞ (1 dakika)

### Adım 9.1: Özet
**Söyle:**
> "Özetle yaptıklarım:
> - **5 bağımsız microservice + 1 gateway**, her biri kendi portunda
> - **PostgreSQL + MongoDB + Redis + RabbitMQ + OpenAI** entegrasyonu
> - **JWT ile kimlik doğrulama** (Supabase Auth)
> - **Cache-aside pattern** (Redis)
> - **Async messaging** (RabbitMQ)
> - **AI Function Calling** (OpenAI GPT-4o-mini)
> - **Cron scheduler** (node-cron)
> - **Optimistic locking** (rezervasyon kapasitesi)
> - **Multi-stage Docker build**
> - **Render.com cloud deployment**
>
> Tüm bu teknolojiler ücretsiz tier'larda çalışıyor.
>
> Sorularınızı bekliyorum."

---

## SORU GELİRSE — HIZLI CEVAPLAR

| Soru | Cevap |
|------|-------|
| **Neden microservice?** | Her servis bağımsız deploy/scale. comments-service çökerse diğerleri çalışır. |
| **Neden Redis?** | Arama sorguları pahalı (join + filter). 5 dakikalık cache büyük performans kazanımı. |
| **Neden RabbitMQ?** | Rezervasyon senkron, bildirim async. Kullanıcı bildirimi beklemez. |
| **Neden MongoDB?** | Yorumlar esnek şema. Rating sub-objesi vs. dinamik. |
| **JWT nasıl?** | Supabase Auth token üretiyor, backend her servisi `jwt.decode()` ile sub'ı alıyor. |
| **Optimistic locking nedir?** | `available_rooms > 0` koşulu ve atomik 1 azaltma. Aynı odayı iki kişi alamaz. |
| **Function calling nedir?** | OpenAI'a "search_hotels" gibi tool tanımları veriyorum, model JSON ile parametreleri üretiyor. |
| **Neden Render free tier?** | Maliyet sıfır. Cold start dezavantajı var (50 sn) ama demo için yeter. |

---

## SON KONTROL LİSTESİ (Demoya başlamadan)

- [ ] Tüm Render servisleri "Live" mi?
- [ ] Bir test otel oluşturulmuş mu? (Sumeyye Otel - İzmir)
- [ ] O otelin en az 1 odası var mı, kapasitesi düşük mü (cron için)?
- [ ] Admin hesabıyla giriş yapabiliyorum mu?
- [ ] Normal user hesabıyla giriş yapabiliyorum mu?
- [ ] AI mesajına cevap geliyor mu?
- [ ] CloudAMQP'de en az 1 mesaj görmek için 1 rezervasyon yap önceden
- [ ] VS Code'da hangi dosyaları açacağımı biliyorum

---

*BAŞARILAR! Sakin ol, her şeyi göstermene gerek yok — önemli olan akıcılık.*
