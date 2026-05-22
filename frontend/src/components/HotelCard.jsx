import { useNavigate } from 'react-router-dom';

export default function HotelCard({ hotel, isLoggedIn }) {
  const navigate = useNavigate();
  const cheapestRoom = hotel.rooms?.[0];

  return (
    <div onClick={() => navigate(`/hotel/${hotel.id}`)} style={{
      border: '1px solid #ddd', borderRadius: '8px', padding: '16px', cursor: 'pointer',
      display: 'flex', gap: '16px', marginBottom: '16px', background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
    }}>
      <div style={{ width: '200px', height: '140px', borderRadius: '6px', flexShrink: 0, overflow: 'hidden', background: '#eee' }}>
        {hotel.image_url ? (
          <img src={hotel.image_url} alt={hotel.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '13px' }}>
            Görsel Yok
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px', color: '#333' }}>{hotel.name}</h3>
        <p style={{ margin: '0 0 8px', color: '#666', fontSize: '14px' }}>{hotel.city}, {hotel.country}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {hotel.amenities?.map(a => (
            <span key={a} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{a}</span>
          ))}
        </div>
        {'★'.repeat(hotel.star_rating || 0)}
      </div>
      {cheapestRoom && (
        <div style={{ textAlign: 'right', minWidth: '140px' }}>
          {isLoggedIn && (
            <div style={{ background: '#cc0000', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '4px' }}>
              %15 İndirim
            </div>
          )}
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
            {cheapestRoom.display_price} TL
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>gecelik</div>
        </div>
      )}
    </div>
  );
}
