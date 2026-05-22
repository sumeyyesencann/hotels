import { useState } from 'react';
import api from '../lib/api';

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/v1/ai/chat', { messages: updated });
      setMessages([...updated, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Bir hata oluştu, tekrar deneyin.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {open && (
        <div style={{ width: '360px', height: '480px', background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
          <div style={{ background: '#cc0000', color: 'white', padding: '12px 16px', borderRadius: '12px 12px 0 0', fontWeight: 'bold' }}>
            AI Asistan
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && (
              <p style={{ color: '#999', fontSize: '14px' }}>Merhaba! Otel aramanıza yardımcı olabilirim. Örnek: "İstanbul'da 15-18 Temmuz için 2 kişilik otel ara"</p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#cc0000' : '#f0f0f0',
                color: m.role === 'user' ? 'white' : '#333',
                padding: '8px 12px', borderRadius: '12px', maxWidth: '85%', fontSize: '14px',
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', color: '#999', fontSize: '14px' }}>Yanıt yazıyor...</div>}
          </div>
          <div style={{ padding: '12px', display: 'flex', gap: '8px', borderTop: '1px solid #eee' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Mesaj yaz..."
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
            />
            <button onClick={sendMessage} style={{ background: '#cc0000', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
              Gönder
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{
        background: '#cc0000', color: 'white', border: 'none', borderRadius: '50%',
        width: '56px', height: '56px', fontSize: '24px', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'block', marginLeft: 'auto'
      }}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
