import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          // Önce public.users'a ekle (trigger'dan önce garantilemek için)
          await supabase
            .from('users')
            .upsert([{ id: data.user.id, email: data.user.email }]);

          if (role === 'admin') {
            const { error: adminError } = await supabase
              .from('hotel_admins')
              .insert([{ user_id: data.user.id, hotel_id: null }]);
            if (adminError) throw new Error('Admin kaydı oluşturulamadı: ' + adminError.message);
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '420px', margin: '80px auto', padding: '32px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '24px', color: '#333' }}>{isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</h2>

      {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
        <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />

        {isRegister && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>Hesap Türü</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                flex: 1, padding: '12px', border: `2px solid ${role === 'user' ? '#cc0000' : '#ddd'}`,
                borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                background: role === 'user' ? '#fff5f5' : 'white'
              }}>
                <input type="radio" value="user" checked={role === 'user'} onChange={() => setRole('user')} style={{ display: 'none' }} />
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>👤</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: role === 'user' ? '#cc0000' : '#333' }}>Misafir</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Otel ara ve rezervasyon yap</div>
              </label>

              <label style={{
                flex: 1, padding: '12px', border: `2px solid ${role === 'admin' ? '#cc0000' : '#ddd'}`,
                borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                background: role === 'admin' ? '#fff5f5' : 'white'
              }}>
                <input type="radio" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} style={{ display: 'none' }} />
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>🏨</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: role === 'admin' ? '#cc0000' : '#333' }}>Otel Yöneticisi</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Otel ve oda yönet</div>
              </label>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          background: loading ? '#999' : '#cc0000', color: 'white', border: 'none',
          padding: '12px', borderRadius: '6px', fontSize: '15px',
          cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold'
        }}>
          {loading ? 'Lütfen bekleyin...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>

      <p style={{ marginTop: '16px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        {isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}{' '}
        <span onClick={() => { setIsRegister(!isRegister); setError(''); setRole('user'); }}
          style={{ color: '#cc0000', cursor: 'pointer', fontWeight: '500' }}>
          {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
        </span>
      </p>
    </div>
  );
}
