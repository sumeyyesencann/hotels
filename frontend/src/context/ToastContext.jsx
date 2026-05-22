import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#2e7d32' : t.type === 'error' ? '#c62828' : '#1565c0',
            color: 'white',
            padding: '14px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            fontSize: '14px',
            maxWidth: '360px',
            animation: 'slideIn 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
