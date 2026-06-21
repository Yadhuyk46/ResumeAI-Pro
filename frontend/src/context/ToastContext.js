import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
    warn:    (msg) => addToast(msg, 'warn'),
  };

  const colors = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: '✅', text: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  icon: '❌', text: '#ef4444' },
    info:    { bg: 'rgba(0,229,255,0.12)',   border: 'rgba(0,229,255,0.35)', icon: 'ℹ️', text: '#00e5ff' },
    warn:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', icon: '⚠️', text: '#f59e0b' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              background: '#0d1117', border: `1px solid ${c.border}`,
              borderRadius: 12, padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 360, boxShadow: `0 4px 20px ${c.border}`,
              animation: 'slideIn 0.25s ease',
              pointerEvents: 'all',
            }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(60px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
