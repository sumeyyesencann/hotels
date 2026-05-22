import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState({ name: '', description: '', city: '', country: '', address: '', latitude: '', longitude: '', star_rating: 3, amenities: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [room, setRoom] = useState({ hotel_id: '', room_type: 'Standard', capacity: 2, price_per_night: '', total_rooms: 1, available_rooms: 1, availability_start: '', availability_end: '' });
  const [hotelMsg, setHotelMsg] = useState('');
  const [roomMsg, setRoomMsg] = useState('');
  const [hotelList, setHotelList] = useState([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchHotels = () => {
    api.get('/api/v1/hotels').then(({ data }) => {
      if (Array.isArray(data)) setHotelList(data);
    }).catch(() => {});
  };

  useEffect(() => { fetchHotels(); }, []);

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Lütfen giriş yapın.</div>;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('hotels-image')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error('Görsel yüklenemedi: ' + error.message);

    const { data } = supabase.storage.from('hotels-image').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createHotel = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let image_url = null;
      if (imageFile) {
        try {
          image_url = await uploadImage(imageFile);
        } catch (imgErr) {
          console.warn('Görsel yüklenemedi, devam ediliyor:', imgErr.message);
        }
      }

      const payload = {
        ...hotel,
        image_url,
        amenities: hotel.amenities.split(',').map(s => s.trim()).filter(Boolean),
        star_rating: parseInt(hotel.star_rating),
        latitude: parseFloat(hotel.latitude) || null,
        longitude: parseFloat(hotel.longitude) || null
      };

      const { data } = await api.post('/api/v1/hotels', payload);
      setHotelMsg(`Otel oluşturuldu: ${data.name}`);
      fetchHotels();
      setHotelSearch(data.name);
      setRoom(prev => ({ ...prev, hotel_id: data.id }));
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setHotelMsg('Hata: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const addRoom = async (e) => {
    e.preventDefault();
    if (!room.hotel_id) return setRoomMsg('Hata: Lütfen bir otel seçin');
    try {
      const { data } = await api.post(`/api/v1/hotels/${room.hotel_id}/rooms`, {
        ...room, capacity: parseInt(room.capacity), total_rooms: parseInt(room.total_rooms),
        available_rooms: parseInt(room.available_rooms), price_per_night: parseFloat(room.price_per_night)
      });
      setRoomMsg(`Oda eklendi: ${data.room_type}`);
    } catch (err) {
      setRoomMsg('Hata: ' + (err.response?.data?.error || err.message));
    }
  };

  const filtered = hotelList.filter(h => h.name?.toLowerCase().includes(hotelSearch.toLowerCase()));

  const inp = (style = {}) => ({ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', ...style });

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#333', margin: 0 }}>Admin Panel</h1>
        <button
          onClick={() => navigate('/admin/hotels')}
          style={{ background: '#003580', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          Otelleri Yönet ({hotelList.length})
        </button>
      </div>

      <section style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2>Yeni Otel Ekle</h2>
        {hotelMsg && <p style={{ color: hotelMsg.startsWith('Hata') ? 'red' : 'green' }}>{hotelMsg}</p>}
        <form onSubmit={createHotel} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input placeholder="Otel Adı *" required value={hotel.name} onChange={e => setHotel({...hotel, name: e.target.value})} style={inp()} />
          <input placeholder="Şehir *" required value={hotel.city} onChange={e => setHotel({...hotel, city: e.target.value})} style={inp()} />
          <input placeholder="Ülke *" required value={hotel.country} onChange={e => setHotel({...hotel, country: e.target.value})} style={inp()} />
          <input placeholder="Adres" value={hotel.address} onChange={e => setHotel({...hotel, address: e.target.value})} style={inp()} />
          <input placeholder="Enlem (ör: 41.015)" value={hotel.latitude} onChange={e => setHotel({...hotel, latitude: e.target.value})} style={inp()} />
          <input placeholder="Boylam (ör: 28.979)" value={hotel.longitude} onChange={e => setHotel({...hotel, longitude: e.target.value})} style={inp()} />
          <select value={hotel.star_rating} onChange={e => setHotel({...hotel, star_rating: e.target.value})} style={inp()}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Yıldız</option>)}
          </select>
          <input placeholder="Olanaklar (virgülle: Havuz, WiFi)" value={hotel.amenities} onChange={e => setHotel({...hotel, amenities: e.target.value})} style={inp()} />
          <textarea placeholder="Açıklama" value={hotel.description} onChange={e => setHotel({...hotel, description: e.target.value})} style={{ ...inp(), gridColumn: 'span 2', resize: 'vertical' }} />

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
              Otel Fotoğrafı (isteğe bağlı)
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange}
              style={{ ...inp(), width: '100%', padding: '6px' }} />
            {imagePreview && (
              <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} alt="Önizleme"
                  style={{ width: '200px', height: '130px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: '#cc0000', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>
                  ✕
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={uploading}
            style={{ gridColumn: 'span 2', background: uploading ? '#999' : '#cc0000', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {uploading ? 'Yükleniyor...' : 'Oteli Kaydet'}
          </button>
        </form>
      </section>

      <section style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2>Oda Ekle / Müsaitlik Güncelle</h2>
        {roomMsg && <p style={{ color: roomMsg.startsWith('Hata') ? 'red' : 'green' }}>{roomMsg}</p>}
        <form onSubmit={addRoom} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          <div style={{ gridColumn: 'span 2', position: 'relative' }}>
            <input
              placeholder="Otel Adı ile Ara *"
              value={hotelSearch}
              onChange={e => { setHotelSearch(e.target.value); setRoom(prev => ({ ...prev, hotel_id: '' })); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={{ ...inp(), width: '100%', boxSizing: 'border-box', border: room.hotel_id ? '1px solid #28a745' : '1px solid #ddd' }}
            />
            {room.hotel_id && (
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#28a745', fontSize: '16px' }}>✓</span>
            )}
            {showSuggestions && hotelSearch && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                {filtered.map(h => (
                  <div key={h.id}
                    onMouseDown={() => { setHotelSearch(h.name); setRoom(prev => ({ ...prev, hotel_id: h.id })); setShowSuggestions(false); }}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <strong>{h.name}</strong>
                    <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>{h.city}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select value={room.room_type} onChange={e => setRoom({...room, room_type: e.target.value})} style={inp()}>
            {['Standard', 'Aile', 'Deluxe', 'Suite'].map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Kapasite (kişi)" required value={room.capacity} onChange={e => setRoom({...room, capacity: e.target.value})} style={inp()} />
          <input type="number" placeholder="Fiyat/Gece (TL)" required value={room.price_per_night} onChange={e => setRoom({...room, price_per_night: e.target.value})} style={inp()} />
          <input type="number" placeholder="Toplam Oda Sayısı" required value={room.total_rooms} onChange={e => setRoom({...room, total_rooms: e.target.value})} style={inp()} />
          <input type="number" placeholder="Müsait Oda Sayısı" required value={room.available_rooms} onChange={e => setRoom({...room, available_rooms: e.target.value})} style={inp()} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Müsaitlik Başlangıç</label>
            <input type="date" required value={room.availability_start} onChange={e => setRoom({...room, availability_start: e.target.value})} style={inp()} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Müsaitlik Bitiş</label>
            <input type="date" required value={room.availability_end} onChange={e => setRoom({...room, availability_end: e.target.value})} style={inp()} />
          </div>
          <button type="submit" style={{ gridColumn: 'span 2', background: '#003580', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Odayı Kaydet
          </button>
        </form>
      </section>

    </div>
  );
}
