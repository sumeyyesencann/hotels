const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const redis = require('../cache/redis');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Tüm otelleri listele (dropdown için)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, city, country, address, star_rating, amenities, image_url, description')
    .order('name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Yeni otel ekle
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, city, country, address, latitude, longitude, star_rating, amenities, image_url } = req.body;
  const { data, error } = await supabase.from('hotels').insert([
    { name, description, city, country, address, latitude, longitude, star_rating, amenities, image_url }
  ]).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Otel detayı
router.get('/:id', async (req, res) => {
  const cacheKey = `hotel:${req.params.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('hotels')
    .select('*, rooms(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Otel bulunamadı' });

  await redis.set(cacheKey, data, { ex: 3600 });
  res.json(data);
});

// Otel güncelle
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('hotels')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await redis.del(`hotel:${req.params.id}`);
  res.json(data);
});

// Oda ekle
router.post('/:id/rooms', authenticate, requireAdmin, async (req, res) => {
  const { room_type, capacity, price_per_night, total_rooms, available_rooms, availability_start, availability_end } = req.body;
  const { data, error } = await supabase.from('rooms').insert([{
    hotel_id: req.params.id,
    room_type,
    capacity,
    price_per_night,
    total_rooms,
    available_rooms,
    is_available: available_rooms > 0,
    availability_start,
    availability_end
  }]).select().single();

  if (error) return res.status(400).json({ error: error.message });
  await redis.del(`hotel:${req.params.id}`);
  res.status(201).json(data);
});

// Otel sil
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('hotels')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await redis.del(`hotel:${req.params.id}`);
  res.json({ message: 'Otel silindi' });
});

// Oda sil
router.delete('/:id/rooms/:roomId', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', req.params.roomId)
    .eq('hotel_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await redis.del(`hotel:${req.params.id}`);
  res.json({ message: 'Oda silindi' });
});

// Oda güncelle
router.put('/:id/rooms/:roomId', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('rooms')
    .update({ ...req.body, updated_at: new Date() })
    .eq('id', req.params.roomId)
    .eq('hotel_id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await redis.del(`hotel:${req.params.id}`);
  res.json(data);
});

// Otel odalarını listele
router.get('/:id/rooms', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('rooms')
    .select('*', { count: 'exact' })
    .eq('hotel_id', req.params.id)
    .range(from, from + limit - 1);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data, total: count, page, limit });
});

module.exports = router;
