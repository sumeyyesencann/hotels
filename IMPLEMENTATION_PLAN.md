# Hotel Booking System — Implementation Plan
> SE 4458 Software Architecture & Design of Modern Large Scale Systems — Final (Group 1)

---

## 0. Kim Ne Yapıyor?

### Senin Yapacakların (Bir Kez Yapılır, Bilgi Verilir)

| Görev | Nerede | Durum |
|---|---|---|
| Supabase'de SQL tabloları oluştur (hotels, rooms, reservations, hotel_admins) | supabase.com → SQL Editor | Bekliyor |
| Supabase URL ve anon key'i bana ver | Supabase → Project Settings → API | Hazır (var) |
| MongoDB Atlas'ta `hotels` adında database, `comments` adında collection oluştur | cloud.mongodb.com | Bekliyor |
| MongoDB connection string'i bana ver | Atlas → Connect → Drivers | Hazır (var) |
| Upstash Redis URL ve token'ı bana ver | upstash.com → Dashboard | Hazır (var) |
| CloudAMQP AMQP URL'ini bana ver | cloudamqp.com → Details | Hazır (var) |
| OpenAI API key'i bana ver | platform.openai.com | Hazır (var) |
| GitHub repo linkini ver, benim yazdığım kodu oraya commit et | github.com | Bekliyor |
| Render.com'da her servisi deploy et (benim vereceğim komutlarla) | render.com | Bekliyor |
| Her servisin Render URL'ini bana bildir | Render dashboard | Bekliyor |
| Demo videosu çek (max 5 dk) | Ekran kaydı | En sonda |

> Yani senin işin: platformlarda hesap açmak, bilgileri bana vermek, deploy tuşlarına basmak, video çekmek.

---

### Benim Yapacaklarım (Kodun tamamı)

| Görev | Açıklama |
|---|---|
| Tüm backend servislerini yazmak | gateway, hotel-service, comments-service, notification-service, ai-agent-service |
| Tüm frontend'i yazmak | React sayfaları, harita, grafik, AI chat penceresi |
| Tüm Dockerfile'ları yazmak | Her servis için ayrı |
| Supabase SQL şemasını yazmak | Tabloları oluşturacak SQL kodunu sana vereceğim |
| MongoDB collection şemasını yazmak | Mongoose model kodu |
| Redis cache mantığını yazmak | Cache-aside pattern |
| RabbitMQ producer ve consumer'ı yazmak | Rezervasyon kuyruğu |
| Scheduler'ı yazmak | node-cron ile gece görevleri |
| AI Agent'ı yazmak | OpenAI function calling |
| .env.example dosyalarını yazmak | Hangi değişkeni nereye yazacağını göstereceğim |
| README.md yazmak | GitHub için, ER diyagramı dahil |
| Her adımda seni yönlendirmek | "Şimdi şunu yap, bunu kopyala, şuraya yapıştır" |

---

### Birlikte Yapacaklarımız (Sırayla)

```
1. Ben SQL kodunu yazarım → Sen Supabase'e yapıştırırsın
2. Ben kodu yazarım → Sen .env dosyasına değerleri girersin
3. Ben Dockerfile'ı yazarım → Sen Render'a push edersin
4. Test ederiz → Sen tarayıcıdan denersin, bana söylersin
5. Hata varsa → Ben düzeltirim
```

---

## 1. Proje Özeti

Hotels.com benzeri bir otel rezervasyon sistemi. Microservice mimarisi ile tasarlanacak, her servis bağımsız deploy edilecek.

**Öğrenci:** Sümeyye Şencan  
**Tarih:** Mayıs 2026

---

## 2. Servisler (Ödev Kapsamı)

| Servis | Açıklama |
|---|---|
| Hotel Admin Service | Otel yöneticileri oda ekler/günceller (authenticated) |
| Hotel Search Service | Destinasyon, tarih, kişi sayısına göre arama + harita |
| Book Hotel Service | Otel detay sayfasından rezervasyon, kapasite düşümü |
| Hotel Comments Service | Yorum ve servis bazlı dağılım grafikleri |
| Notification Service | Gece çalışan scheduler: kapasite uyarısı + yeni rezervasyon bildirimi |
| AI Agent Service | Chat üzerinden arama ve rezervasyon |

---

## 3. Teknoloji Seçimleri

### Neden Node.js + Express?

- Render.com'da deploy en basit
- REST API yazmak çok hızlı
- Tüm seçilen servislerle (Supabase, MongoDB, Redis, RabbitMQ, OpenAI) mükemmel kütüphane desteği var
- JSON tabanlı çalışma yapısı
- TypeScript ile tip güvenliği eklenebilir

### Neden React + Vite (Frontend)?

- Hızlı kurulum, modern tooling
- Render.com'a static site olarak deploy edilir (ücretsiz)
- Leaflet.js harita entegrasyonu kolay

---

## 4. Kullanılan Servisler ve Rolleri

| Servis | Platform | Rol |
|---|---|---|
| **Supabase** | supabase.com | Auth (IAM) + PostgreSQL (ana DB) |
| **MongoDB Atlas** | cloud.mongodb.com | Comments NoSQL DB |
| **Upstash Redis** | upstash.com | Hotel Details Cache |
| **CloudAMQP** | cloudamqp.com | RabbitMQ Queue (yeni rezervasyon kuyruğu) |
| **OpenAI** | platform.openai.com | AI Agent (GPT-4o) |
| **Render.com** | render.com | Tüm servislerin deploy ortamı |
| **GitHub** | github.com | Kaynak kod, public repo |

---

## 5. Mimari Tasarım

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│              Render Static Site                      │
└────────────────────┬────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│              API GATEWAY (Express)                   │
│         /api/v1/hotels  →  Hotel Service            │
│         /api/v1/search  →  Search Service           │
│         /api/v1/book    →  Hotel Service            │
│         /api/v1/comments→  Comments Service         │
│         /api/v1/ai      →  AI Agent Service         │
│              Render Web Service                      │
└──┬──────────────┬──────────────┬────────────────────┘
   │              │              │
   ▼              ▼              ▼
Hotel Service  Comments     Notification
(Express)      Service      Service
Render         (Express)    (Express + node-cron)
   │           Render       Render
   │              │
   ▼              ▼
Supabase DB   MongoDB Atlas
(PostgreSQL)  (Comments)
   │
   ├──► Upstash Redis (Hotel Cache)
   │
   └──► CloudAMQP / RabbitMQ (Reservation Queue)
         │
         ▼
     Notification Service (queue consumer)

Auth: Supabase Auth (tüm servislerde JWT doğrulama)
AI: OpenAI API (AI Agent Service içinde)
Map: Leaflet.js + OpenStreetMap (ücretsiz, API key gerektirmez)
```

---

## 6. Veri Modelleri

### 6.1 Supabase PostgreSQL Tabloları

```sql
-- Oteller
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odalar
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,  -- 'Standard', 'Aile', 'Deluxe', 'Suite'
  capacity INT NOT NULL,
  price_per_night NUMERIC(10,2) NOT NULL,
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  availability_start DATE,
  availability_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rezervasyonlar
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Supabase auth.users id
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INT NOT NULL,
  total_price NUMERIC(10,2),
  is_discounted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed',  -- 'confirmed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Otel Admin yetkilendirme
CREATE TABLE hotel_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Supabase auth.users id
  hotel_id UUID REFERENCES hotels(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 MongoDB Atlas — Comments Collection

```json
{
  "_id": "ObjectId",
  "hotel_id": "uuid-string",
  "user_id": "uuid-string",
  "user_name": "string",
  "overall_rating": 8.8,
  "ratings": {
    "temizlik": 9.6,
    "personel_ve_servis": 9.6,
    "imkan_ve_ozellikler": 9.4,
    "konaklama_durumu": 9.6,
    "cevre_dostlugu": 9.4
  },
  "comment_text": "string",
  "stay_duration_nights": 4,
  "created_at": "ISODate"
}
```

### 6.3 Upstash Redis — Hotel Cache

```
KEY: hotel:{hotel_id}
VALUE: JSON (hotel detayları + müsait odalar)
TTL: 3600 saniye (1 saat)

KEY: search:{city}:{check_in}:{check_out}:{guests}
VALUE: JSON array (arama sonuçları)
TTL: 300 saniye (5 dakika)
```

### 6.4 CloudAMQP / RabbitMQ — Queue

```
Queue: new_reservations
Message: {
  reservation_id: string,
  hotel_id: string,
  hotel_admin_email: string,
  user_email: string,
  check_in: date,
  check_out: date,
  room_type: string,
  guest_count: number,
  total_price: number
}
```

---

## 7. API Endpoint Tasarımı

Tüm endpointler versiyonlanmış: `/api/v1/...`

### Hotel Admin Service (Authenticated)
```
POST   /api/v1/hotels              → Yeni otel ekle
GET    /api/v1/hotels/:id          → Otel detayı
PUT    /api/v1/hotels/:id          → Otel güncelle

POST   /api/v1/hotels/:id/rooms    → Oda ekle / müsaitlik güncelle
PUT    /api/v1/hotels/:id/rooms/:roomId → Oda güncelle
GET    /api/v1/hotels/:id/rooms    → Odaları listele (pagination)
```

### Hotel Search Service
```
GET    /api/v1/search?city=&check_in=&check_out=&guests=&page=&limit=
       → Müsait otelleri döner (Redis cache'den veya DB'den)
       → Giriş yapmış kullanıcıya fiyatlarda %15 indirim
```

### Book Hotel Service
```
POST   /api/v1/reservations        → Rezervasyon oluştur (kapasite düş, kuyruğa at)
GET    /api/v1/reservations        → Kullanıcının rezervasyonları (pagination)
GET    /api/v1/reservations/:id    → Rezervasyon detayı
```

### Comments Service
```
POST   /api/v1/comments            → Yorum ekle
GET    /api/v1/comments/:hotel_id  → Otel yorumları (pagination)
GET    /api/v1/comments/:hotel_id/stats → Grafik için dağılım istatistikleri
```

### AI Agent Service
```
POST   /api/v1/ai/chat             → { messages: [...] } → AI yanıtı
```

### Notification Service
```
(Dışarıya açık endpoint yok — sadece scheduler ve queue consumer çalışır)
```

---

## 8. Kimlik Doğrulama (Auth)

- **Supabase Auth** kullanılır
- Kayıt/giriş: Supabase client SDK üzerinden (email + password)
- Backend'e her istek `Authorization: Bearer <JWT>` header ile gider
- Backend middleware'de `supabase.auth.getUser(token)` ile doğrulanır
- Admin rolü `hotel_admins` tablosundan kontrol edilir

```
Admin erişimi:
1. JWT doğrula
2. hotel_admins tablosunda user_id kontrol et
3. Yoksa 403 Forbidden
```

---

## 9. Kritik İş Mantıkları

### %15 İndirim
```javascript
// Search sonuçlarında:
const isLoggedIn = !!req.user;
const finalPrice = isLoggedIn 
  ? room.price_per_night * 0.85 
  : room.price_per_night;
```

### Kapasite Düşümü (Rezervasyon)
```javascript
// Rezervasyon sırasında:
// 1. available_rooms > 0 kontrolü yap
// 2. available_rooms -= 1 (atomic update ile)
// 3. Rezervasyonu kaydet
// 4. RabbitMQ kuyruğuna mesaj at
// 5. Redis cache'i invalidate et (hotel:{hotel_id})
```

### Müsait Oda Arama
```sql
SELECT r.* FROM rooms r
WHERE r.hotel_id = $1
  AND r.is_available = TRUE
  AND r.available_rooms > 0
  AND r.availability_start <= $2   -- check_in
  AND r.availability_end >= $3     -- check_out
  AND r.capacity >= $4;            -- guest_count
```

### Harita (Haritada Göster)
- Leaflet.js + OpenStreetMap kullanılır (ücretsiz, API key gerekmez)
- Otellerin `latitude` ve `longitude` bilgisi DB'de saklanır
- Arama sonuçları harita üzerinde pin olarak gösterilir

---

## 10. Notification Service — Scheduler Detayları

`node-cron` paketi ile her gece 00:00'da iki görev çalışır:

### Görev 1: Düşük Kapasite Uyarısı
```
Her gece 00:00'da:
1. Tüm otelleri çek
2. Sonraki 1 ay içindeki rezervasyonları kontrol et
3. Doluluk oranı > %80 olan odaları bul (available_rooms / total_rooms < 0.20)
4. İlgili otel adminine email gönder (Supabase veya nodemailer ile)
```

### Görev 2: Rezervasyon Bildirimi
```
Her gece 00:00'da (veya sürekli consumer olarak):
1. RabbitMQ kuyruğundaki (new_reservations) yeni mesajları çek
2. Her mesaj için kullanıcıya rezervasyon detaylarını email ile gönder
3. Otel adminine de bildirim gönder
```

---

## 11. AI Agent Tasarımı

- **Model:** `gpt-4o-mini` (maliyet optimizasyonu için)
- **Yaklaşım:** Function Calling (Tool Use)
- AI'a 2 tool tanımlanır:
  - `search_hotels(city, check_in, check_out, guests)` → `/api/v1/search` çağırır
  - `book_hotel(hotel_id, room_id, check_in, check_out, guests)` → `/api/v1/reservations` çağırır
- Real-time messaging gerekmez (ödev şartı)
- Frontend'de basit bir chat penceresi yeterli

```javascript
// Tool definition örneği:
const tools = [
  {
    type: "function",
    function: {
      name: "search_hotels",
      description: "Otelleri şehir, tarih ve kişi sayısına göre arar",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          check_in: { type: "string", format: "date" },
          check_out: { type: "string", format: "date" },
          guests: { type: "number" }
        },
        required: ["city", "check_in", "check_out", "guests"]
      }
    }
  }
];
```

---

## 12. Klasör Yapısı

```
Hotels/
├── IMPLEMENTATION_PLAN.md       ← bu dosya
├── README.md                    ← GitHub için (deployed URLs, ER diagram, video)
│
├── backend/
│   ├── gateway/                 ← API Gateway (Express)
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── middleware/
│   │   │   │   └── auth.js      ← Supabase JWT doğrulama
│   │   │   └── routes/
│   │   │       └── proxy.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── hotel-service/           ← Admin + Search + Book servisleri
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── db/
│   │   │   │   └── supabase.js
│   │   │   ├── cache/
│   │   │   │   └── redis.js
│   │   │   ├── queue/
│   │   │   │   └── rabbitmq.js
│   │   │   ├── routes/
│   │   │   │   ├── admin.js
│   │   │   │   ├── search.js
│   │   │   │   └── reservations.js
│   │   │   └── middleware/
│   │   │       └── auth.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── comments-service/        ← MongoDB tabanlı yorumlar
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── db/
│   │   │   │   └── mongodb.js
│   │   │   ├── models/
│   │   │   │   └── Comment.js
│   │   │   └── routes/
│   │   │       └── comments.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── notification-service/    ← Scheduler + Queue Consumer
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── scheduler/
│   │   │   │   ├── capacityCheck.js
│   │   │   │   └── reservationNotifier.js
│   │   │   ├── queue/
│   │   │   │   └── consumer.js
│   │   │   └── mailer/
│   │   │       └── sendEmail.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── ai-agent-service/        ← OpenAI function calling
│       ├── src/
│       │   ├── index.js
│       │   ├── agent/
│       │   │   ├── tools.js
│       │   │   └── chat.js
│       │   └── routes/
│       │       └── ai.js
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
│
└── frontend/                    ← React + Vite
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Search.jsx
    │   │   ├── HotelDetail.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── Login.jsx
    │   ├── components/
    │   │   ├── HotelCard.jsx
    │   │   ├── MapView.jsx          ← Leaflet.js
    │   │   ├── CommentChart.jsx     ← Recharts
    │   │   ├── AIChat.jsx
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   └── useAuth.js
    │   └── lib/
    │       ├── supabase.js
    │       └── api.js
    ├── package.json
    └── vite.config.js
```

---

## 13. Environment Variables

Her servis için `.env.example`:

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # sadece backend

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hotels

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# CloudAMQP (RabbitMQ)
CLOUDAMQP_URL=amqps://user:pass@xxx.cloudamqp.com/vhost

# OpenAI
OPENAI_API_KEY=sk-...

# Port
PORT=3001
```

---

## 14. Implementasyon Adımları (Sıralı)

### Faz 1 — Temel Kurulum (2-3 gün)
- [ ] GitHub repo oluştur, klasör yapısını kur
- [ ] Supabase'de tabloları oluştur (hotels, rooms, reservations, hotel_admins)
- [ ] MongoDB Atlas'ta `hotels` database ve `comments` collection oluştur
- [ ] Her servis için `package.json` ve `index.js` oluştur
- [ ] `.env` dosyalarını doldur

### Faz 2 — Hotel Admin Service (1-2 gün)
- [ ] Supabase bağlantısını kur
- [ ] Auth middleware yaz (JWT doğrulama)
- [ ] `POST /api/v1/hotels` — otel ekle
- [ ] `POST /api/v1/hotels/:id/rooms` — oda ekle/güncelle
- [ ] Admin kontrolü (hotel_admins tablosu)

### Faz 3 — Hotel Search Service (1-2 gün)
- [ ] Upstash Redis bağlantısını kur
- [ ] `GET /api/v1/search` — müsait oda sorgusu
- [ ] Redis cache entegrasyonu (cache-aside pattern)
- [ ] %15 indirim mantığı (logged-in user kontrolü)

### Faz 4 — Book Hotel Service (1 gün)
- [ ] CloudAMQP/RabbitMQ bağlantısını kur
- [ ] `POST /api/v1/reservations` — rezervasyon oluştur
- [ ] Atomic kapasite düşümü (Supabase transaction)
- [ ] Kuyruğa mesaj at
- [ ] Redis invalidation

### Faz 5 — Comments Service (1 gün)
- [ ] MongoDB bağlantısını kur (Mongoose)
- [ ] Comment modeli oluştur
- [ ] `POST /api/v1/comments` — yorum ekle
- [ ] `GET /api/v1/comments/:hotel_id/stats` — grafik verisi

### Faz 6 — Notification Service (1 gün)
- [ ] `node-cron` ile gece görevlerini kur
- [ ] Kapasite kontrolü (Görev 1)
- [ ] RabbitMQ consumer (Görev 2)
- [ ] Email gönderimi (nodemailer veya Supabase Edge Functions)

### Faz 7 — AI Agent Service (1-2 gün)
- [ ] OpenAI bağlantısı
- [ ] Tool definitionları yaz (search + book)
- [ ] Chat endpoint'i yaz
- [ ] Frontend chat bileşeni

### Faz 8 — Frontend (2-3 gün)
- [ ] React + Vite kurulum
- [ ] Supabase Auth (login/register sayfaları)
- [ ] Arama sayfası + Leaflet.js harita
- [ ] Otel detay sayfası + rezervasyon formu
- [ ] Yorum sayfası + Recharts grafik
- [ ] Admin paneli (oda ekleme/güncelleme)
- [ ] AI chat penceresi

### Faz 9 — Deploy (1-2 gün)
- [ ] Her servis için Dockerfile yaz
- [ ] Render.com'a her servisi ayrı Web Service olarak deploy et
- [ ] Frontend'i Render Static Site olarak deploy et
- [ ] Environment variable'ları Render dashboard'dan gir
- [ ] API gateway URL'lerini güncelle

---

## 15. Deployment Planı (Render.com)

| Servis | Render Tipi | URL |
|---|---|---|
| API Gateway | Web Service | `hotels-gateway.onrender.com` |
| Hotel Service | Web Service | `hotels-hotel-service.onrender.com` |
| Comments Service | Web Service | `hotels-comments.onrender.com` |
| Notification Service | Web Service | `hotels-notifications.onrender.com` |
| AI Agent Service | Web Service | `hotels-ai.onrender.com` |
| Frontend | Static Site | `hotels-frontend.onrender.com` |

Her Web Service'te:
- Build command: `npm install`
- Start command: `node src/index.js`
- Environment variables: Render dashboard'dan giriliyor

---

## 16. Paketler (npm)

### Her backend serviste:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1"
  }
}
```

### Hotel Service ek paketler:
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@upstash/redis": "^1.28.0",
  "amqplib": "^0.10.3"
}
```

### Comments Service ek paketler:
```json
{
  "mongoose": "^8.0.0"
}
```

### Notification Service ek paketler:
```json
{
  "node-cron": "^3.0.3",
  "amqplib": "^0.10.3",
  "nodemailer": "^6.9.7",
  "@supabase/supabase-js": "^2.38.0"
}
```

### AI Agent Service ek paketler:
```json
{
  "openai": "^4.20.1"
}
```

### Frontend paketler:
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@supabase/supabase-js": "^2.38.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "recharts": "^2.10.1",
  "axios": "^1.6.0"
}
```

---

## 17. Dockerfile Şablonu (Her Servis İçin)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
```

---

## 18. Varsayımlar (Assumptions)

1. Ödeme entegrasyonu yok — rezervasyon oluşturmak yeterli
2. Otel fotoğrafı yükleme zorunlu değil (nice-to-have)
3. Harita için OpenStreetMap kullanılıyor (Google Maps API key gerektirmez)
4. Email bildirimleri için nodemailer + Gmail SMTP veya Supabase Edge Functions kullanılır
5. AI Agent real-time değil — her mesaj POST isteği ile gider
6. Kapasite kontrolü, oda bazında yapılır (available_rooms alanı)
7. Giriş yapmış kullanıcı = Supabase session'ı olan kullanıcı
8. Admin = hotel_admins tablosunda kaydı olan kullanıcı

---

## 19. README İçin Gerekli Dokümanlar

GitHub repo'da README.md şunları içermeli:
- [ ] Deployed URL'ler (Render)
- [ ] ER Diyagramı (dbdiagram.io ile çizilebilir)
- [ ] Tasarım kararları ve varsayımlar
- [ ] Karşılaşılan sorunlar
- [ ] 5 dakikalık demo video linki (YouTube unlisted)

---

## 20. Kodlamaya Başlamadan Yapılacaklar (Checklist)

- [x] Supabase hesabı — URL + anon key hazır
- [x] MongoDB Atlas — connection string hazır
- [x] Upstash Redis — URL + token hazır
- [x] CloudAMQP — AMQP URL hazır
- [x] OpenAI API key hazır
- [x] GitHub public repo oluşturuldu
- [x] Render.com hesabı açıldı
- [ ] Supabase'de tabloları oluştur (SQL Editor)
- [ ] MongoDB'de database ve collection oluştur
- [ ] GitHub repo'yu clone et, klasör yapısını oluştur
- [ ] İlk commit'i at

---

*Bu plan SE 4458 final ödevi Group 1 (Hotel Booking System) için hazırlanmıştır.*
