import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav style={{ background: '#cc0000', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ color: 'white', fontWeight: 'bold', fontSize: '22px', textDecoration: 'none' }}>
        Hotels.com
      </Link>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" style={{ color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                🏨 Admin Panel
              </Link>
            )}
            {!isAdmin && (
              <Link to="/reservations" style={{ color: 'white', textDecoration: 'none' }}>Rezervasyonlarım</Link>
            )}
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{user.email}</span>
            <button onClick={handleSignOut} style={{ background: 'white', color: '#cc0000', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}>
              Çıkış
            </button>
          </>
        ) : (
          <Link to="/login">
            <button style={{ background: 'white', color: '#cc0000', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Giriş Yap
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
