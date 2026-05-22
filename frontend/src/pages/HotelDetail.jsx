import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import CommentChart from '../components/CommentChart';
import { useToast } from '../context/ToastContext';

export default function HotelDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState(null);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [booking, setBooking] = useState(false);
  const [commentForm, setCommentForm] = useState({ overall_rating: 8, comment_text: '', stay_duration_nights: 1, ratings: { temizlik: 8, personel_ve_servis: 8, imkan_ve_ozellikler: 8, konaklama_durumu: 8, cevre_dostlugu: 8 } });
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentMsg, setCommentMsg] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');

  const fetchStats = () => {
    api.get(`/api/v1/comments/${id}/stats`).then(({ data }) => setStats(data));
    api.get(`/api/v1/comments/${id}`).then(({ data }) => setComments(data.data || []));
  };

  useEffect(() => {
    api.get(`/api/v1/hotels/${id}`).then(({ data }) => setHotel(data));
    fetchStats();
  }, [id]);

  const handleBook = async (room) => {
    if (!user) return navigate('/login');
    setBooking(true);
    try {
      await api.post('/api/v1/reservations', {
        hotel_id: id,
        room_id: room.id,
        check_in: checkIn || new Date().toISOString().split('T')[0],
        check_out: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guest_count: 2
      });
      addToast('Rezervasyonunuz başarıyla oluşturuldu!', 'success');
      setTimeout(() => navigate('/reservations'), 1500);
    } catch (err) {
      addToast('Rezervasyon hatası: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setBooking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post('/api/v1/comments', { hotel_id: id, ...commentForm });
      addToast('Yorumunuz başarıyla eklendi!', 'success');
      setCommentMsg('');
      setShowCommentForm(false);
      setCommentForm({ overall_rating: 8, comment_text: '', stay_duration_nights: 1, ratings: { temizlik: 8, personel_ve_servis: 8, imkan_ve_ozellikler: 8, konaklama_durumu: 8, cevre_dostlugu: 8 } });
      fetchStats();
    } catch (err) {
      setCommentMsg('Hata: ' + (err.response?.data?.error || err.message));
    }
  };

  const discountedPrice = (price) => user ? +(price * 0.85).toFixed(2) : price;

  if (!hotel) return <div style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

  const inp = { padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '960px', margin: '32px auto', padding: '0 24px' }}>
      {hotel.image_url && (
        <div style={{ width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <img src={hotel.image_url} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <h1 style={{ color: '#333' }}>{hotel.name}</h1>
      <p style={{ color: '#666' }}>{hotel.city}, {hotel.country} — {'★'.repeat(hotel.star_rating || 0)}</p>
      {hotel.amenities?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {hotel.amenities.map(a => (
            <span key={a} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>{a}</span>
          ))}
        </div>
      )}
      <p style={{ color: '#555' }}>{hotel.description}</p>

      {/* Değerlendirmeler */}
      <div style={{ margin: '24px 0' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
          {stats && stats.count > 0 ? (
            <span style={{ background: '#003580', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '18px' }}>
              {stats.overall_avg}/10
            </span>
          ) : (
            <span style={{ background: '#888', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '14px' }}>
              Henüz değerlendirme yok
            </span>
          )}
          {stats && stats.count > 0 && (
            <span style={{ color: '#333', fontWeight: 'bold' }}>{stats.count} değerlendirme</span>
          )}
          {stats && stats.count > 0 && (
            <button onClick={() => setShowComments(!showComments)} style={{
              background: 'none', border: '1px solid #003580', color: '#003580',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
            }}>
              {showComments ? 'Gizle' : 'Yorumları Gör'}
            </button>
          )}
          {user && (
            <button onClick={() => setShowCommentForm(!showCommentForm)} style={{
              background: '#cc0000', color: 'white', border: 'none',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
            }}>
              Yorum Yaz
            </button>
          )}
        </div>

        {commentMsg && <p style={{ color: commentMsg.startsWith('Hata') ? 'red' : 'green' }}>{commentMsg}</p>}

        {showCommentForm && (
          <form onSubmit={handleComment} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Yorum Yaz</h3>
            <label style={{ fontSize: '13px', color: '#555' }}>
              Genel Puan: <strong>{commentForm.overall_rating}/10</strong>
              <input type="range" min="1" max="10" value={commentForm.overall_rating}
                onChange={e => setCommentForm(p => ({ ...p, overall_rating: +e.target.value }))}
                style={{ width: '100%', marginTop: '4px' }} />
            </label>
            {[
              ['temizlik', 'Temizlik'],
              ['personel_ve_servis', 'Personel ve Servis'],
              ['imkan_ve_ozellikler', 'İmkan ve Özellikler'],
              ['konaklama_durumu', 'Konaklama Durumu'],
              ['cevre_dostlugu', 'Çevre Dostluğu'],
            ].map(([key, label]) => (
              <label key={key} style={{ fontSize: '13px', color: '#555' }}>
                {label}: <strong>{commentForm.ratings[key]}/10</strong>
                <input type="range" min="1" max="10" value={commentForm.ratings[key]}
                  onChange={e => setCommentForm(p => ({ ...p, ratings: { ...p.ratings, [key]: +e.target.value } }))}
                  style={{ width: '100%', marginTop: '4px' }} />
              </label>
            ))}
            <input type="number" min="1" max="30" placeholder="Konaklama süresi (gün)" value={commentForm.stay_duration_nights}
              onChange={e => setCommentForm(p => ({ ...p, stay_duration_nights: +e.target.value }))}
              style={inp} />
            <textarea placeholder="Yorumunuz..." required value={commentForm.comment_text}
              onChange={e => setCommentForm(p => ({ ...p, comment_text: e.target.value }))}
              style={{ ...inp, resize: 'vertical', minHeight: '80px' }} />
            <button type="submit" style={{ background: '#cc0000', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Yorumu Gönder
            </button>
          </form>
        )}

        {showComments && stats && stats.count > 0 && (
          <>
            <CommentChart stats={stats} />
            <div style={{ marginTop: '24px' }}>
              {comments.map(c => (
                <div key={c._id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{c.user_name}</strong>
                    <span style={{ background: '#003580', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
                      {c.overall_rating}/10
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#555' }}>{c.comment_text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Odalar */}
      <h2 style={{ color: '#333', marginTop: '32px' }}>Odalar</h2>
      {user && (
        <p style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '8px 12px', color: '#2e7d32', fontSize: '14px' }}>
          Üye fiyatı: tüm odalarda %15 indirim uygulandı
        </p>
      )}
      {hotel.rooms?.map(room => {
        const price = discountedPrice(room.price_per_night);
        return (
          <div key={room.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{room.room_type}</h3>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Kapasite: {room.capacity} kişi</p>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Müsait: {room.available_rooms} oda</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {user && room.price_per_night !== price && (
                <div style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>{room.price_per_night} TL</div>
              )}
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>{price} TL</div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>gecelik</div>
              <button onClick={() => handleBook(room)} disabled={booking || room.available_rooms <= 0}
                style={{ background: room.available_rooms > 0 ? '#cc0000' : '#ccc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: room.available_rooms > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                {room.available_rooms > 0 ? 'Rezervasyon Yap' : 'Dolu'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
