import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

const inp = (extra = {}) => ({
  padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd',
  fontSize: '14px', width: '100%', boxSizing: 'border-box', ...extra
});

export default function AdminHotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [hotel, setHotel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [editRoomId, setEditRoomId] = useState(null);
  const [editRoomData, setEditRoomData] = useState({});
  const [savingRoom, setSavingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);

  const [newRoom, setNewRoom] = useState({ room_type: 'Standard', capacity: 2, price_per_night: '', total_rooms: 1, available_rooms: 1, availability_start: '', availability_end: '' });
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);

  const fetchHotel = async () => {
    const { data } = await api.get(`/api/v1/hotels/${id}`);
    setHotel(data);
    setRooms(data.rooms || []);
    setEditData({
      name: data.name, city: data.city, country: data.country,
      address: data.address || '', description: data.description || '',
      star_rating: data.star_rating, amenities: (data.amenities || []).join(', '),
      latitude: data.latitude || '', longitude: data.longitude || ''
    });
  };

  useEffect(() => { fetchHotel(); }, [id]);

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Lütfen giriş yapın.</div>;
  if (!hotel) return <div style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('hotels-image').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from('hotels-image').getPublicUrl(fileName).data.publicUrl;
  };

  const handleSaveHotel = async () => {
    setSaving(true);
    try {
      let image_url = hotel.image_url;
      if (imageFile) image_url = await uploadImage(imageFile);
      const payload = {
        ...editData,
        image_url,
        star_rating: parseInt(editData.star_rating),
        amenities: editData.amenities.split(',').map(s => s.trim()).filter(Boolean),
        latitude: parseFloat(editData.latitude) || null,
        longitude: parseFloat(editData.longitude) || null,
      };
      await api.put(`/api/v1/hotels/${id}`, payload);
      addToast('Otel güncellendi.', 'success');
      setEditing(false);
      setImageFile(null);
      setImagePreview(null);
      fetchHotel();
    } catch (err) {
      addToast('Hata: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!window.confirm(`"${hotel.name}" otelini silmek istediğinize emin misiniz? Tüm odalar da silinecek.`)) return;
    try {
      await api.delete(`/api/v1/hotels/${id}`);
      addToast('Otel silindi.', 'success');
      navigate('/admin/hotels');
    } catch (err) {
      addToast('Hata: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleSaveRoom = async (roomId) => {
    setSavingRoom(true);
    try {
      await api.put(`/api/v1/hotels/${id}/rooms/${roomId}`, {
        ...editRoomData,
        capacity: parseInt(editRoomData.capacity),
        total_rooms: parseInt(editRoomData.total_rooms),
        available_rooms: parseInt(editRoomData.available_rooms),
        price_per_night: parseFloat(editRoomData.price_per_night),
        is_available: parseInt(editRoomData.available_rooms) > 0
      });
      addToast('Oda güncellendi.', 'success');
      setEditRoomId(null);
      fetchHotel();
    } catch (err) {
      addToast('Hata: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomType) => {
    if (!window.confirm(`"${roomType}" odasını silmek istediğinize emin misiniz?`)) return;
    setDeletingRoom(roomId);
    try {
      await api.delete(`/api/v1/hotels/${id}/rooms/${roomId}`);
      addToast('Oda silindi.', 'success');
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) {
      addToast('Hata: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setDeletingRoom(null);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setAddingRoom(true);
    try {
      await api.post(`/api/v1/hotels/${id}/rooms`, {
        ...newRoom,
        capacity: parseInt(newRoom.capacity),
        total_rooms: parseInt(newRoom.total_rooms),
        available_rooms: parseInt(newRoom.available_rooms),
        price_per_night: parseFloat(newRoom.price_per_night),
      });
      addToast('Oda eklendi.', 'success');
      setShowAddRoom(false);
      setNewRoom({ room_type: 'Standard', capacity: 2, price_per_night: '', total_rooms: 1, available_rooms: 1, availability_start: '', availability_end: '' });
      fetchHotel();
    } catch (err) {
      addToast('Hata: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setAddingRoom(false);
    }
  };

  const section = (children, style = {}) => ({
    background: 'white', borderRadius: '10px', padding: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: '20px', ...style
  });

  const badge = (color, text) => (
    <span style={{ background: color, color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{text}</span>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>

      {/* Üst bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/admin/hotels')}
          style={{ background: 'none', border: '1px solid #ccc', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', color: '#555', fontSize: '14px' }}>
          ← Oteller
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setImageFile(null); setImagePreview(null); }}
                style={{ border: '1px solid #ccc', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                İptal
              </button>
              <button onClick={handleSaveHotel} disabled={saving}
                style={{ background: saving ? '#999' : '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                style={{ background: '#003580', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                Düzenle
              </button>
              <button onClick={handleDeleteHotel}
                style={{ background: '#cc0000', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                Oteli Sil
              </button>
            </>
          )}
        </div>
      </div>

      {/* Otel Bilgileri */}
      <div style={section()}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Görsel */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: '220px', height: '150px', borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0', border: '1px solid #ddd' }}>
              {(imagePreview || hotel.image_url) ? (
                <img src={imagePreview || hotel.image_url} alt={hotel.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '13px' }}>Görsel Yok</div>
              )}
            </div>
            {editing && (
              <div style={{ marginTop: '8px' }}>
                <input type="file" accept="image/*"
                  onChange={e => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }}
                  style={{ fontSize: '12px', width: '220px' }} />
              </div>
            )}
          </div>

          {/* Bilgiler */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="Otel Adı *" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} style={inp()} />
                <select value={editData.star_rating} onChange={e => setEditData(p => ({ ...p, star_rating: e.target.value }))} style={inp()}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Yıldız</option>)}
                </select>
                <input placeholder="Şehir" value={editData.city} onChange={e => setEditData(p => ({ ...p, city: e.target.value }))} style={inp()} />
                <input placeholder="Ülke" value={editData.country} onChange={e => setEditData(p => ({ ...p, country: e.target.value }))} style={inp()} />
                <input placeholder="Adres" value={editData.address} onChange={e => setEditData(p => ({ ...p, address: e.target.value }))} style={inp({ gridColumn: 'span 2' })} />
                <input placeholder="Enlem" value={editData.latitude} onChange={e => setEditData(p => ({ ...p, latitude: e.target.value }))} style={inp()} />
                <input placeholder="Boylam" value={editData.longitude} onChange={e => setEditData(p => ({ ...p, longitude: e.target.value }))} style={inp()} />
                <input placeholder="Olanaklar (virgülle)" value={editData.amenities} onChange={e => setEditData(p => ({ ...p, amenities: e.target.value }))} style={inp({ gridColumn: 'span 2' })} />
                <textarea placeholder="Açıklama" value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                  style={{ ...inp({ gridColumn: 'span 2' }), resize: 'vertical', minHeight: '70px' }} />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ margin: 0, color: '#222' }}>{hotel.name}</h2>
                  {badge('#f5a623', '★'.repeat(hotel.star_rating || 0))}
                </div>
                <p style={{ margin: '0 0 4px', color: '#555' }}>{hotel.city}, {hotel.country}</p>
                {hotel.address && <p style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}>{hotel.address}</p>}
                {hotel.latitude && <p style={{ margin: '0 0 8px', color: '#aaa', fontSize: '12px' }}>📍 {hotel.latitude}, {hotel.longitude}</p>}
                {hotel.description && <p style={{ margin: '0 0 10px', color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{hotel.description}</p>}
                {hotel.amenities?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {hotel.amenities.map(a => (
                      <span key={a} style={{ background: '#f0f0f0', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', color: '#555' }}>{a}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Odalar */}
      <div style={section()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Odalar ({rooms.length})</h2>
          <button onClick={() => setShowAddRoom(!showAddRoom)}
            style={{ background: '#003580', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showAddRoom ? 'İptal' : '+ Oda Ekle'}
          </button>
        </div>

        {/* Yeni oda formu */}
        {showAddRoom && (
          <form onSubmit={handleAddRoom} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select value={newRoom.room_type} onChange={e => setNewRoom(p => ({ ...p, room_type: e.target.value }))} style={inp()}>
              {['Standard', 'Aile', 'Deluxe', 'Suite'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Kapasite (kişi)" required value={newRoom.capacity} onChange={e => setNewRoom(p => ({ ...p, capacity: e.target.value }))} style={inp()} />
            <input type="number" placeholder="Fiyat/Gece (TL)" required value={newRoom.price_per_night} onChange={e => setNewRoom(p => ({ ...p, price_per_night: e.target.value }))} style={inp()} />
            <input type="number" placeholder="Toplam Oda" required value={newRoom.total_rooms} onChange={e => setNewRoom(p => ({ ...p, total_rooms: e.target.value }))} style={inp()} />
            <input type="number" placeholder="Müsait Oda" required value={newRoom.available_rooms} onChange={e => setNewRoom(p => ({ ...p, available_rooms: e.target.value }))} style={inp()} />
            <div />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '11px', color: '#666' }}>Başlangıç</label>
              <input type="date" required value={newRoom.availability_start} onChange={e => setNewRoom(p => ({ ...p, availability_start: e.target.value }))} style={inp()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '11px', color: '#666' }}>Bitiş</label>
              <input type="date" required value={newRoom.availability_end} onChange={e => setNewRoom(p => ({ ...p, availability_end: e.target.value }))} style={inp()} />
            </div>
            <button type="submit" disabled={addingRoom}
              style={{ gridColumn: 'span 2', background: addingRoom ? '#999' : '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {addingRoom ? 'Ekleniyor...' : 'Odayı Kaydet'}
            </button>
          </form>
        )}

        {rooms.length === 0 ? (
          <p style={{ color: '#888' }}>Henüz oda eklenmemiş.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rooms.map(room => (
              <div key={room.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                {editRoomId === room.id ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <select value={editRoomData.room_type} onChange={e => setEditRoomData(p => ({ ...p, room_type: e.target.value }))} style={inp()}>
                      {['Standard', 'Aile', 'Deluxe', 'Suite'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="number" placeholder="Kapasite" value={editRoomData.capacity} onChange={e => setEditRoomData(p => ({ ...p, capacity: e.target.value }))} style={inp()} />
                    <input type="number" placeholder="Fiyat/Gece" value={editRoomData.price_per_night} onChange={e => setEditRoomData(p => ({ ...p, price_per_night: e.target.value }))} style={inp()} />
                    <input type="number" placeholder="Toplam Oda" value={editRoomData.total_rooms} onChange={e => setEditRoomData(p => ({ ...p, total_rooms: e.target.value }))} style={inp()} />
                    <input type="number" placeholder="Müsait Oda" value={editRoomData.available_rooms} onChange={e => setEditRoomData(p => ({ ...p, available_rooms: e.target.value }))} style={inp()} />
                    <div />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '11px', color: '#666' }}>Başlangıç</label>
                      <input type="date" value={editRoomData.availability_start} onChange={e => setEditRoomData(p => ({ ...p, availability_start: e.target.value }))} style={inp()} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '11px', color: '#666' }}>Bitiş</label>
                      <input type="date" value={editRoomData.availability_end} onChange={e => setEditRoomData(p => ({ ...p, availability_end: e.target.value }))} style={inp()} />
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditRoomId(null)}
                        style={{ border: '1px solid #ccc', background: 'white', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
                      <button onClick={() => handleSaveRoom(room.id)} disabled={savingRoom}
                        style={{ background: '#28a745', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {savingRoom ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '15px' }}>{room.room_type}</strong>
                        {badge(room.available_rooms > 0 ? '#28a745' : '#dc3545',
                          room.available_rooms > 0 ? 'Müsait' : 'Dolu')}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>👤 {room.capacity} kişi</span>
                        <span>🛏 {room.available_rooms}/{room.total_rooms} oda</span>
                        <span>💰 {room.price_per_night} TL/gece</span>
                        {room.availability_start && (
                          <span>📅 {room.availability_start} → {room.availability_end}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setEditRoomId(room.id); setEditRoomData({ ...room, amenities: undefined }); }}
                        style={{ background: '#003580', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.room_type)}
                        disabled={deletingRoom === room.id}
                        style={{ background: deletingRoom === room.id ? '#ccc' : '#cc0000', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        {deletingRoom === room.id ? '...' : 'Sil'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
