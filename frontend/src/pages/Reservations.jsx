import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Reservations() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return navigate('/login');
    api.get('/api/v1/reservations').then(({ data }) => {
      setReservations(data.data || []);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ color: '#333' }}>Rezervasyonlarım</h1>
      {reservations.length === 0 ? (
        <p style={{ color: '#666' }}>Henüz rezervasyonunuz yok.</p>
      ) : (
        reservations.map(r => (
          <div key={r.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '16px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{r.hotels?.name}</h3>
                <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>{r.rooms?.room_type}</p>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                  {r.check_in} → {r.check_out} • {r.guest_count} misafir
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{r.total_price} TL</div>
                <span style={{ background: r.status === 'confirmed' ? '#28a745' : '#dc3545', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                  {r.status === 'confirmed' ? 'Onaylandı' : 'İptal'}
                </span>
                {r.is_discounted && <div style={{ color: '#cc0000', fontSize: '12px', marginTop: '4px' }}>%15 indirim uygulandı</div>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
