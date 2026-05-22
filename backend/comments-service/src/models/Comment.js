const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  hotel_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  overall_rating: { type: Number, required: true, min: 0, max: 10 },
  ratings: {
    temizlik: { type: Number, min: 0, max: 10 },
    personel_ve_servis: { type: Number, min: 0, max: 10 },
    imkan_ve_ozellikler: { type: Number, min: 0, max: 10 },
    konaklama_durumu: { type: Number, min: 0, max: 10 },
    cevre_dostlugu: { type: Number, min: 0, max: 10 }
  },
  comment_text: { type: String, required: true },
  stay_duration_nights: { type: Number },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
