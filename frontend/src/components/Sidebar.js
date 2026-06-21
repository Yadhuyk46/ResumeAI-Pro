import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ navItems, active, onNav }) {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 230,
      background: '#060910', borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#00e5ff,#6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#e2e8f0', lineHeight: 1.2 }}>ResumeAI Pro</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>
              {user?.role === 'admin' ? '⚡ Admin Panel' : '🚀 User Dashboard'}
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #0d1117', background: '#0a0f1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: user?.avatar_color || 'linear-gradient(135deg,#00e5ff,#6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0] || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#334155', fontFamily: 'monospace',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 8px', marginBottom: 4,
            }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const isActive = active === item.key;
              return (
                <button key={item.key} onClick={() => onNav(item.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 9, marginBottom: 2,
                    background: isActive ? 'rgba(0,229,255,0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(0,229,255,0.2)' : 'transparent'}`,
                    color: isActive ? '#00e5ff' : '#64748b',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 12, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5,
                    borderRadius: '50%', background: '#00e5ff' }} />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #1e293b' }}>
        <button onClick={logout}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 9,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
            color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          <span>🚪</span><span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
