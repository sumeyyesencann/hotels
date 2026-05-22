const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token gerekli' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Geçersiz token' });
  req.user = user;
  next();
}

// Yorum ekle
router.post('/', authenticate, async (req, res) => {
  const { hotel_id, overall_rating, ratings, comment_text, stay_duration_nights } = req.body;
  const comment = new Comment({
    hotel_id,
    user_id: req.user.id,
    user_name: req.user.email.split('@')[0],
    overall_rating,
    ratings,
    comment_text,
    stay_duration_nights
  });
  await comment.save();
  res.status(201).json(comment);
});

// Otel yorumları (pagination)
router.get('/:hotel_id', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ hotel_id: req.params.hotel_id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments({ hotel_id: req.params.hotel_id })
  ]);

  res.json({ data: comments, total, page, limit });
});

// Grafik istatistikleri
router.get('/:hotel_id/stats', async (req, res) => {
  const stats = await Comment.aggregate([
    { $match: { hotel_id: req.params.hotel_id } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        overall_avg: { $avg: '$overall_rating' },
        temizlik_avg: { $avg: '$ratings.temizlik' },
        personel_avg: { $avg: '$ratings.personel_ve_servis' },
        imkan_avg: { $avg: '$ratings.imkan_ve_ozellikler' },
        konaklama_avg: { $avg: '$ratings.konaklama_durumu' },
        cevre_avg: { $avg: '$ratings.cevre_dostlugu' }
      }
    }
  ]);

  if (!stats.length) return res.json({ count: 0 });

  const s = stats[0];
  res.json({
    count: s.count,
    overall_avg: +s.overall_avg.toFixed(1),
    categories: {
      Temizlik: +s.temizlik_avg?.toFixed(1),
      'Personel ve Servis': +s.personel_avg?.toFixed(1),
      'İmkan ve Özellikler': +s.imkan_avg?.toFixed(1),
      'Konaklama Durumu': +s.konaklama_avg?.toFixed(1),
      'Çevre Dostluğu': +s.cevre_avg?.toFixed(1)
    }
  });
});

module.exports = router;
