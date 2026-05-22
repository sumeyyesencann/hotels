import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

export default function MapView({ hotels }) {
  const navigate = useNavigate();
  const center = hotels.length > 0
    ? [hotels[0].latitude || 41.015, hotels[0].longitude || 28.979]
    : [41.015, 28.979];

  return (
    <MapContainer center={center} zoom={12} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hotels.map(hotel => hotel.latitude && hotel.longitude && (
        <Marker key={hotel.id} position={[hotel.latitude, hotel.longitude]}>
          <Popup>
            <strong>{hotel.name}</strong><br />
            {hotel.city}<br />
            <button onClick={() => navigate(`/hotel/${hotel.id}`)} style={{ marginTop: '4px', cursor: 'pointer' }}>
              Detay
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
