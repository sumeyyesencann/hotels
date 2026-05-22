# Hotel Booking System

SE 4458 — Software Architecture & Design of Modern Large Scale Systems  
**Final Project — Group 1**  
**Sümeyye Şencan**

Hotels.com benzeri bir otel rezervasyon sistemi. Microservice mimarisi, REST API, JWT kimlik doğrulama, Redis cache, RabbitMQ mesaj kuyruğu ve OpenAI destekli AI chatbot içerir.

---

## Canlı Uygulama

| Servis | URL |
|--------|-----|
| **Frontend** | https://hotels-frontend.onrender.com |
| **API Gateway** | https://hotels-gateway.onrender.com |
| Hotel Service | https://hotels-8tpi.onrender.com |
| Comments Service | https://hotels-comments.onrender.com |
| AI Agent Service | https://hotels-ai.onrender.com |
| Notification Service | https://hotels-notification.onrender.com |

> Tüm API istekleri Gateway üzerinden yapılır. Diğer servislere doğrudan erişim gerekmez.

---

## Demo Video
https://drive.google.com/file/d/1AjNCaEubr7IJ70wSi_i9nv2QTUzyemr5/view?usp=sharing

---

## Mimari

```
┌─────────────────────────────┐
│       Frontend (React)       │
│     Render Static Site       │
└──────────────┬──────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│     API Gateway :3000        │
│  /api/v1/hotels    → :3001  │
│  /api/v1/search    → :3001  │
│  /api/v1/reservations→:3001 │
│  /api/v1/comments  → :3002  │
│  /api/v1/ai        → :3003  │
└──┬───────────┬──────────────┘
   │           │
   ▼           ▼
:3001          :3002
Hotel          Comments
Service        Service
│              │
▼              ▼
Supabase    MongoDB Atlas
PostgreSQL
│
├── Upstash Redis (cache)
└── CloudAMQP RabbitMQ ──► :3004 Notification Service
                                  (consumer + cron scheduler)

Auth: Supabase JWT (tüm servislerde)
AI:   OpenAI GPT-4o-mini (:3003)
Map:  Leaflet.js + OpenStreetMap
```

---

## Servisler

### API Gateway (Port 3000)
Tek giriş noktası. `http-proxy-middleware` ile gelen istekleri path'e göre ilgili servise yönlendirir. Authorization header'ı olduğu gibi taşır; her servis kendi auth middleware'iyle doğrular.

### Hotel Service (Port 3001)
En büyük servis. Üç sorumluluğu var:
- **Admin**: Otel ve oda ekleme, düzenleme, silme
- **Search**: Şehir/tarih/kapasite filtreli arama, Redis cache-aside, giriş yapanlara %15 indirim
- **Reservations**: Rezervasyon oluşturma/iptal, atomik kapasite düşümü, RabbitMQ'ya mesaj

### Comments Service (Port 3002)
MongoDB Atlas tabanlı, tamamen bağımsız. Yorumları hotel_id'ye göre depolar ve listeler. Recharts grafik için istatistik endpoint'i içerir.

### AI Agent Service (Port 3003)
OpenAI GPT-4o-mini ve function calling kullanır. `search_hotels`, `get_hotel_details` tool'ları tanımlı; model hangi fonksiyonu çağıracağına kendisi karar verir.

### Notification Service (Port 3004)
İki sorumluluğu var:
- `node-cron` ile her gece 00:00'da kapasite kontrolü (available_rooms / total_rooms < %20 olan odaları tespit eder)
- RabbitMQ `new_reservations` kuyruğunu dinler, yeni rezervasyonları işler

---

## Teknoloji Seçimleri

| Teknoloji | Neden |
|-----------|-------|
| **Supabase (PostgreSQL + Auth)** | Hem veritabanı hem JWT tabanlı auth tek platformda. Row Level Security ile veri izolasyonu. |
| **MongoDB Atlas** | Yorumlar yarı yapısal veri — esnek schema avantajı için NoSQL tercih edildi. |
| **Upstash Redis** | Otel arama sorgularını 5 dakika cache'lemek için. Cache-aside pattern: aynı parametreler tekrar gelince DB'ye gitmez. |
| **CloudAMQP (RabbitMQ)** | Rezervasyon oluşturma senkron, bildirim async olabilir. Kuyruğa atıp kullanıcıya hemen yanıt dönmek için. |
| **OpenAI GPT-4o-mini** | Function calling ile doğal dil → API çağrısı köprüsü. Maliyet/performans dengesi için mini model. |
| **Leaflet.js + OpenStreetMap** | Harita için API key gerektirmez, ücretsiz ve open-source. |
| **Recharts** | React ile doğal entegrasyon, yorum dağılımı için bar chart. |
| **Docker (multi-stage build)** | Frontend: node ile build, nginx ile serve — final image'da Node.js yok, çok küçük. |
| **Render.com** | Her servis bağımsız Web Service / Static Site olarak deploy, ücretsiz tier. |

---

## ER Diyagramı

```
┌─────────────────────┐       ┌─────────────────────────┐
│       hotels        │       │          rooms          │
├─────────────────────┤       ├─────────────────────────┤
│ id           UUID PK│◄──┐   │ id            UUID PK   │
│ name         TEXT   │   │   │ hotel_id      UUID FK──►│
│ description  TEXT   │   │   │ room_type     TEXT      │
│ city         TEXT   │   └───│ capacity      INT       │
│ country      TEXT   │       │ price_per_night NUMERIC │
│ address      TEXT   │       │ total_rooms   INT       │
│ latitude     FLOAT  │       │ available_rooms INT     │
│ longitude    FLOAT  │       │ availability_start DATE │
│ star_rating  INT    │       │ availability_end   DATE │
│ amenities    TEXT[] │       │ created_at    TIMESTAMPTZ│
│ image_url    TEXT   │       └─────────────┬───────────┘
│ created_at   TSTZ   │                     │
└──────────┬──────────┘                     │
           │                                │
           │         ┌──────────────────────▼──────────┐
           │         │         reservations             │
           │         ├─────────────────────────────────┤
           └────────►│ hotel_id      UUID FK            │
                     │ id            UUID PK            │
                     │ user_id       UUID (auth.users)  │
                     │ room_id       UUID FK ──────────►│
                     │ check_in      DATE               │
                     │ check_out     DATE               │
                     │ guest_count   INT                │
                     │ total_price   NUMERIC            │
                     │ is_discounted BOOLEAN            │
                     │ status        TEXT               │
                     │ created_at    TIMESTAMPTZ        │
                     └─────────────────────────────────┘

┌─────────────────────┐
│    public.users     │   (auth.users mirror)
├─────────────────────┤
│ id       UUID PK    │
│ email    TEXT       │
│ is_admin BOOLEAN    │
│ created_at TSTZ     │
└─────────────────────┘

MongoDB Atlas — comments collection:
{
  hotel_id:   String,
  user_id:    String,
  user_name:  String,
  rating:     Number (1–10),
  text:       String,
  created_at: Date
}
```

---

## API Endpoint'leri

Tüm endpointler `https://hotels-gateway.onrender.com` üzerinden erişilir.

### Kimlik Doğrulama
```
POST /api/v1/auth/login     → Supabase Auth (frontend'de yapılır)
```

### Otel Yönetimi (Admin)
```
GET    /api/v1/hotels                     → Otel listesi (admin)
POST   /api/v1/hotels                     → Yeni otel ekle
PUT    /api/v1/hotels/:id                 → Otel güncelle
DELETE /api/v1/hotels/:id                 → Otel sil

POST   /api/v1/hotels/:id/rooms           → Oda ekle
PUT    /api/v1/hotels/:id/rooms/:roomId   → Oda güncelle
DELETE /api/v1/hotels/:id/rooms/:roomId   → Oda sil
GET    /api/v1/hotels/:id                 → Otel detayı
```

### Arama
```
GET /api/v1/search?city=&check_in=&check_out=&guests=&page=&limit=
```
Giriş yapmış kullanıcılara `display_price` %15 indirimli döner.

### Rezervasyon
```
POST   /api/v1/reservations   → Rezervasyon oluştur
GET    /api/v1/reservations   → Kullanıcının rezervasyonları
PUT    /api/v1/reservations/:id/cancel  → İptal et
```

### Yorumlar
```
POST /api/v1/comments              → Yorum ekle
GET  /api/v1/comments/:hotel_id    → Otel yorumları
```

### AI Chat
```
POST /api/v1/ai/chat   → { messages: [...] }
```

---

## Kritik İş Mantıkları

### Cache-aside Pattern (Redis)
```
1. Cache'e bak (search:{city}:{checkIn}:{checkOut}:{guests}:{page})
2. Cache var → direkt dön
3. Cache yok → DB'den çek, cache'e yaz (TTL: 300s), dön
```

### Atomik Kapasite Düşümü
Rezervasyon oluştururken `available_rooms` Supabase'in update API'siyle atomik olarak 1 azaltılır; aynı anda iki kullanıcı aynı son odayı alamaz.

### RabbitMQ Akışı
```
hotel-service (producer)
    → new_reservations queue (CloudAMQP)
        → notification-service (consumer)
```
Rezervasyon oluşturma isteği kuyruğa mesaj bırakıp hemen döner; bildirim async işlenir.

### Kapasite Uyarısı (Cron)
`node-cron` ile `0 0 * * *` — her gece 00:00'da:
```
tüm oteller → odalar → available_rooms/total_rooms < 0.20 → uyarı üret
```

---

## Kurulum (Local)

### Gereksinimler
- Node.js 20+
- Docker (opsiyonel)

### 1. Repoyu klonla
```bash
git clone https://github.com/sumeyyesencan/hotels.git
cd hotels
```

### 2. Her servis için .env oluştur

`backend/hotel-service/.env`:
```env
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
CLOUDAMQP_URL=amqps://user:pass@xxx.cloudamqp.com/vhost
```

`backend/comments-service/.env`:
```env
PORT=3002
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hotels
```

`backend/ai-agent-service/.env`:
```env
PORT=3003
OPENAI_API_KEY=sk-...
HOTEL_SERVICE_URL=http://localhost:3001
```

`backend/notification-service/.env`:
```env
PORT=3004
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLOUDAMQP_URL=amqps://user:pass@xxx.cloudamqp.com/vhost
```

`backend/gateway/.env`:
```env
PORT=3000
HOTEL_SERVICE_URL=http://localhost:3001
COMMENTS_SERVICE_URL=http://localhost:3002
AI_SERVICE_URL=http://localhost:3003
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Servisleri başlat

```bash
# Her servis için ayrı terminal:
cd backend/gateway && npm install && node src/index.js
cd backend/hotel-service && npm install && node src/index.js
cd backend/comments-service && npm install && node src/index.js
cd backend/ai-agent-service && npm install && node src/index.js
cd backend/notification-service && npm install && node src/index.js
cd frontend && npm install && npm run dev
```

---

## Klasör Yapısı

```
Hotels/
├── backend/
│   ├── gateway/                  # API Gateway — Port 3000
│   │   └── src/index.js
│   ├── hotel-service/            # Admin + Search + Book — Port 3001
│   │   └── src/
│   │       ├── routes/admin.js
│   │       ├── routes/search.js
│   │       ├── routes/reservations.js
│   │       ├── middleware/auth.js
│   │       ├── db/supabase.js
│   │       ├── cache/redis.js
│   │       └── queue/rabbitmq.js
│   ├── comments-service/         # MongoDB Yorumlar — Port 3002
│   │   └── src/
│   │       ├── routes/comments.js
│   │       └── models/Comment.js
│   ├── ai-agent-service/         # OpenAI Chatbot — Port 3003
│   │   └── src/routes/ai.js
│   └── notification-service/     # Cron + RabbitMQ Consumer — Port 3004
│       └── src/
│           ├── scheduler/capacityCheck.js
│           └── queue/consumer.js
└── frontend/                     # React + Vite
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── Search.jsx
        │   ├── HotelDetail.jsx
        │   ├── Reservations.jsx
        │   ├── AdminPanel.jsx
        │   ├── AdminHotels.jsx
        │   └── AdminHotelDetail.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── HotelCard.jsx
        │   ├── MapView.jsx        # Leaflet.js
        │   ├── CommentChart.jsx   # Recharts
        │   └── AIChat.jsx
        ├── context/ToastContext.jsx
        └── hooks/useAuth.js
```

---

## Tasarım Kararları

**Neden her işlev ayrı servis değil, hotel-service'te toplandı?**  
Admin, search ve booking tamamı Supabase + Redis + RabbitMQ paylaşıyor. Ayrı servislere bölmek bu session'da ortak bağlantıları duplicate etmek anlamına gelirdi, gereksiz karmaşıklık yaratırdı.

**Neden Gateway auth yapmıyor?**  
Her servis kendi JWT doğrulamasını yapıyor; bu sayede gateway'den bağımsız çalışabilir ve test edilebilir. Gateway sadece yönlendirme sorumluluğunu üstleniyor.

**Neden MongoDB yorumlar için?**  
Yorumlar farklı rating alt alanları içerebilir, zaman içinde schema değişebilir. PostgreSQL'de bu esnek yapıyı yönetmek JSONB gerektirirdi; Mongoose native olarak destekliyor.

**Neden Upstash Redis (HTTP tabanlı)?**  
Render.com'da TCP Redis bağlantısı port kısıtlamalarına takılabiliyor. Upstash'in REST API tabanlı çalışması bu sorunu ortadan kaldırıyor.

---

## Varsayımlar

- Ödeme entegrasyonu yok; rezervasyon oluşturmak yeterli kabul edildi.
- Admin rolü `public.users.is_admin` flag'i ile kontrol ediliyor.
- Kapasite uyarısı konsola yazılıyor; gerçek e-posta entegrasyonu eklenebilir.
- AI agent real-time streaming değil; her mesaj için POST isteği yapılıyor.
- Harita için OpenStreetMap kullanıldı, Google Maps API key'i gerektirmiyor.

---

## Karşılaşılan Sorunlar

**1. Rezervasyon sonrası login sayfasına yönlendirme**  
Supabase session yüklenmeden önce `user` null dönüyor, Reservations sayfası bunu "giriş yapılmamış" olarak okuyordu. `useAuth` hook'una `authLoading` state'i eklenerek çözüldü.

**2. Arama sonuç dönmüyor**  
Supabase inner join sorgusunda `rooms.is_available = true` filtresi tüm sonuçları eliyordu. Null tarihli odaları kapsayan `.or()` koşulları eklenerek düzeltildi.

**3. Kapasite uyarısı 0 sonuç dönüyordu**  
`availability_start` null olan odalar tarih filtresiyle eleniyordu. Null-safe `.or(availability_start.is.null, ...)` pattern'i ile çözüldü.

**4. RabbitMQ consumer terminalde spam**  
Eski consumer process'leri arka planda çalışmaya devam ediyordu. `pkill -f` ile temizlendi.

**5. Render'da Redis URL typo**  
Environment variable adı `UPSTASH_REDIS_REST_URL` yerine `UPSTASH_REDIS_REST_UR` girilmişti. Render dashboard'dan düzeltildi.

---

## Kullanılan Servisler

| Platform | Kullanım Amacı |
|----------|---------------|
| [Supabase](https://supabase.com) | PostgreSQL veritabanı + JWT Auth |
| [MongoDB Atlas](https://cloud.mongodb.com) | Yorumlar (NoSQL) |
| [Upstash](https://upstash.com) | Redis cache |
| [CloudAMQP](https://cloudamqp.com) | RabbitMQ mesaj kuyruğu |
| [OpenAI](https://platform.openai.com) | GPT-4o-mini AI chatbot |
| [Render](https://render.com) | Deploy ortamı |

---

*SE 4458 Final — Mayıs 2026*
