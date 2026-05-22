const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const redis = require('../cache/redis');
const { authenticateOptional } = require('../middleware/auth');

router.get('/', authenticateOptional, async (req, res) => {
  const { city, check_in, check_out, guests, page = 1, limit = 10 } = req.query;

  if (!city || !check_in || !check_out || !guests) {
    return res.status(400).json({ error: 'city, check_in, check_out ve guests zorunlu' });
  }

  const cacheKey = `search:${city}:${check_in}:${check_out}:${guests}:${page}`;
  const cached = await redis.get(cacheKey);

  let hotels;
  if (cached) {
    hotels = cached;
  } else {
    const from = (parseInt(page) - 1) * parseInt(limit);

    const { data, error } = await supabase
      .from('hotels')
      .select(`
        id, name, description, city, country, address, latitude, longitude, star_rating, amenities, image_url,
        rooms!inner(id, room_type, capacity, price_per_night, total_rooms, available_rooms, availability_start, availability_end)
      `)
      .ilike('city', `%${city}%`)
      .gt('rooms.available_rooms', 0)
      .gte('rooms.capacity', parseInt(guests))
      .or(`availability_start.is.null,availability_start.lte.${check_in}`, { referencedTable: 'rooms' })
      .or(`availability_end.is.null,availability_end.gte.${check_out}`, { referencedTable: 'rooms' })
      .range(from, from + parseInt(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    hotels = data;
    await redis.set(cacheKey, hotels, { ex: 300 });
  }

  const isLoggedIn = !!req.user;
  const result = hotels.map(hotel => ({
    ...hotel,
    rooms: hotel.rooms.map(room => ({
      ...room,
      display_price: isLoggedIn
        ? parseFloat((room.price_per_night * 0.85).toFixed(2))
        : room.price_per_night,
      is_discounted: isLoggedIn
    }))
  }));

  res.json({ data: result, is_logged_in: isLoggedIn });
});

module.exports = router;
