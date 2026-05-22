import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import HotelCard from '../components/HotelCard';
import MapView from '../components/MapView';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const city = searchParams.get('city');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guests = searchParams.get('guests');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/v1/search?city=${city}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
        setHotels(data.data || []);
        setIsLoggedIn(data.is_logged_in || false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [city, checkIn, checkOut, guests]);

  return (
    <div style={{ maxWidth: '960px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>{city} — {hotels.length} Otel</h2>
        <button onClick={() => setShowMap(!showMap)} style={{
          background: '#003580', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: '6px', cursor: 'pointer'
        }}>
          {showMap ? 'Listeyi Göster' : 'Haritada Göster'}
        </button>
      </div>

      {!isLoggedIn && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          Giriş yaparak <strong>%15 indirimli</strong> fiyatları görün!
        </div>
      )}

      {loading ? <p>Yükleniyor...</p> : showMap ? (
        <MapView hotels={hotels} />
      ) : (
        hotels.length === 0 ? (
          <p style={{ color: '#666' }}>Bu kriterlere uygun otel bulunamadı.</p>
        ) : (
          hotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} isLoggedIn={isLoggedIn} />)
        )
      )}
    </div>
  );
}
