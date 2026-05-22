const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const redis = require('../cache/redis');
const { publishReservation } = require('../queue/rabbitmq');
const { authenticate } = require('../middleware/auth');

// Rezervasyon oluştur
router.post('/', authenticate, async (req, res) => {
  const { hotel_id, room_id, check_in, check_out, guest_count } = req.body;

  // Oda müsaitlik kontrolü
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', room_id)
    .single();

  if (roomErr || !room) return res.status(404).json({ error: 'Oda bulunamadı' });
  if (room.available_rooms <= 0) return res.status(400).json({ error: 'Oda dolu' });

  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
  const isDiscounted = true;
  const total_price = parseFloat((room.price_per_night * 0.85 * nights).toFixed(2));

  // Atomic kapasite düşümü
  const { error: updateErr } = await supabase
    .from('rooms')
    .update({
      available_rooms: room.available_rooms - 1,
      is_available: room.available_rooms - 1 > 0,
      updated_at: new Date()
    })
    .eq('id', room_id)
    .eq('available_rooms', room.available_rooms); // optimistic lock

  if (updateErr) return res.status(409).json({ error: 'Rezervasyon çakışması, tekrar deneyin' });

  // Rezervasyonu kaydet
  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .insert([{
      user_id: req.user.id,
      hotel_id,
      room_id,
      check_in,
      check_out,
      guest_count,
      total_price,
      is_discounted: isDiscounted,
      status: 'confirmed'
    }])
    .select('*, hotels(name), rooms(room_type)')
    .single();

  if (resErr) return res.status(400).json({ error: resErr.message });

  // Redis cache temizle
  await redis.del(`hotel:${hotel_id}`);

  // Kuyruğa at
  try {
    await publishReservation({
      reservation_id: reservation.id,
      hotel_id,
      hotel_name: reservation.hotels?.name,
      user_id: req.user.id,
      user_email: req.user.email,
      check_in,
      check_out,
      room_type: reservation.rooms?.room_type,
      guest_count,
      total_price
    });
  } catch (e) {
    console.error('Queue error:', e.message);
  }

  res.status(201).json(reservation);
});

// Kullanıcının rezervasyonları
router.get('/', authenticate, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('reservations')
    .select('*, hotels(name, city), rooms(room_type)', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data, total: count, page, limit });
});

// Rezervasyon detayı
router.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, hotels(*), rooms(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Rezervasyon bulunamadı' });
  res.json(data);
});

module.exports = router;
