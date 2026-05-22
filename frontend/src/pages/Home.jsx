import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?city=${city}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #cc0000, #ff4444)', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '40px', margin: '0 0 8px' }}>Nereye?</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', marginBottom: '32px' }}>Binlerce otelden en uygununu bul</p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '900px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input placeholder="Varış noktası (şehir)" value={city} onChange={e => setCity(e.target.value)} required
            style={{ flex: '2', minWidth: '200px', padding: '14px', borderRadius: '6px', border: 'none', fontSize: '15px' }} />
          <div style={{ flex: '1', minWidth: '140px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '6px', padding: '6px 14px' }}>
            <label style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Giriş Tarihi</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required
              style={{ border: 'none', fontSize: '15px', outline: 'none', padding: 0 }} />
          </div>
          <div style={{ flex: '1', minWidth: '140px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '6px', padding: '6px 14px' }}>
            <label style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Çıkış Tarihi</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required
              style={{ border: 'none', fontSize: '15px', outline: 'none', padding: 0 }} />
          </div>
          <select value={guests} onChange={e => setGuests(e.target.value)}
            style={{ flex: '1', minWidth: '120px', padding: '14px', borderRadius: '6px', border: 'none', fontSize: '15px' }}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Misafir</option>)}
          </select>
          <button type="submit" style={{ background: '#003580', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
            Ara
          </button>
        </form>
      </div>

      {!user && (
        <div style={{ maxWidth: '900px', margin: '48px auto', padding: '24px', textAlign: 'center', background: '#fff8e1', borderRadius: '12px', border: '1px solid #ffe082' }}>
          <h2 style={{ color: '#333', marginBottom: '8px' }}>Giriş yaparak %15 indirim kazan!</h2>
          <p style={{ color: '#666', margin: 0 }}>Binlerce otelde üye fiyatları ile daha uygun rezervasyon yap.</p>
        </div>
      )}

      {user && (
        <div style={{ maxWidth: '900px', margin: '48px auto', padding: '24px', textAlign: 'center', background: '#e8f5e9', borderRadius: '12px', border: '1px solid #a5d6a7' }}>
          <h2 style={{ color: '#2e7d32', marginBottom: '8px' }}>Hosgeldin! Tüm fiyatlarda %15 indirim aktif.</h2>
          <p style={{ color: '#555', margin: 0 }}>Üye fiyatları otomatik olarak uygulanıyor.</p>
        </div>
      )}
    </div>
  );
}
