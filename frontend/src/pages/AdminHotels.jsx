import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function AdminHotels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchHotels = () => {
    api.get('/api/v1/hotels').then(({ data }) => {
      if (Array.isArray(data)) setHotels(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchHotels(); }, []);

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Lütfen giriş yapın.</div>;

  const handleDelete = async (hotel) => {
    if (!window.confirm(`"${hotel.name}" otelini silmek istediğinize emin misiniz?`)) return;
    setDeleting(hotel.id);
    try {
      await api.delete(`/api/v1/hotels/${hotel.id}`);
      addToast(`"${hotel.name}" silindi.`, 'success');
      setHotels(prev => prev.filter(h => h.id !== hotel.id));
    } catch (err) {
      addToast('Silme hatası: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#333', margin: 0 }}>Mevcut Oteller ({hotels.length})</h1>
        <button
          onClick={() => navigate('/admin')}
          style={{ background: '#cc0000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Yeni Otel / Oda Ekle
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Yükleniyor...</p>
      ) : hotels.length === 0 ? (
        <p style={{ color: '#888' }}>Henüz otel eklenmemiş.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {hotels.map(h => (
            <div key={h.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '1px solid #eee' }}>
              <div style={{ width: '100%', height: '180px', background: '#f0f0f0', overflow: 'hidden', position: 'relative' }}>
                {h.image_url ? (
                  <img src={h.image_url} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '14px' }}>
                    Görsel Yok
                  </div>
                )}
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#003580', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {'★'.repeat(h.star_rating || 0)}
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#222' }}>{h.name}</h3>
                <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>
                  {h.city}{h.country ? `, ${h.country}` : ''}
                </p>
                {h.address && (
                  <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>{h.address}</p>
                )}
                {h.description && (
                  <p style={{ margin: '0 0 8px', color: '#555', fontSize: '13px', lineHeight: '1.4',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {h.description}
                  </p>
                )}
                {h.amenities?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {h.amenities.slice(0, 4).map(a => (
                      <span key={a} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', color: '#555' }}>{a}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => navigate(`/admin/hotels/${h.id}`)}
                    style={{ flex: 1, background: '#f0f0f0', color: '#333', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Yönet
                  </button>
                  <button
                    onClick={() => { navigate('/admin'); setTimeout(() => { window.dispatchEvent(new CustomEvent('selectHotel', { detail: h })); }, 100); }}
                    style={{ flex: 1, background: '#003580', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Oda Ekle
                  </button>
                  <button
                    onClick={() => handleDelete(h)}
                    disabled={deleting === h.id}
                    style={{ background: deleting === h.id ? '#ccc' : '#cc0000', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: deleting === h.id ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                    {deleting === h.id ? '...' : 'Sil'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
