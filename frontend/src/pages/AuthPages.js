import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Spinner({ size = 18, color = '#060910' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.2)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.65s linear infinite',
      flexShrink: 0,
    }} />
  );
}

/* ── Clean standalone login page (NOT below landing) ── */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const role = await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');
      nav(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const fillDemo = (type) => {
    if (type === 'admin') { setEmail('admin1@resumeai.com'); setPassword('Admin@1234'); }
    else { setEmail('demo@user.com'); setPassword('demo123'); }
    setShowDemo(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)', top: -150, left: -150, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(109,40,217,0.07) 0%,transparent 70%)', bottom: -100, right: -100, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s ease', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
         <div style={{ textAlign: 'center', marginBottom: 32 }}>

  <Link
    to="/home"
    style={{
      position: 'fixed',      // makes it stay at top-left
      top: '20px',
      left: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      textDecoration: 'none',
      color: '#475569',
      fontSize: 12,
      fontFamily: 'var(--mono)',
      transition: 'color 0.2s',
      zIndex: 1000
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
  >
    ← Back to Home
  </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#00e5ff,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 32px rgba(0,229,255,0.3)' }}>🧠</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em' }}>Resume<span style={{ color: '#00e5ff' }}>AI</span></div>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>PRO PLATFORM</div>
            </div>
          </div>
          <p style={{ color: '#475569', fontSize: 13, fontFamily: 'var(--mono)' }}>Sign in to your account</p>
        </div>

        {/* Role selector tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 6 }}>
          {[{ key: 'user', icon: '👤', label: 'User Login', color: '#00e5ff' }, { key: 'admin', icon: '🛡', label: 'Admin Login', color: '#818cf8' }].map(tab => (
            <button key={tab.key} onClick={() => { if (tab.key === 'admin') fillDemo('admin'); else fillDemo('user'); }}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                background: (tab.key === 'admin' && email.includes('admin')) || (tab.key === 'user' && !email.includes('admin')) ? `${tab.color}15` : 'transparent',
                color: (tab.key === 'admin' && email.includes('admin')) || (tab.key === 'user' && !email.includes('admin')) ? tab.color : '#475569',
                boxShadow: (tab.key === 'admin' && email.includes('admin')) || (tab.key === 'user' && !email.includes('admin')) ? `0 0 12px ${tab.color}22` : 'none',
              }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.08em' }}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '11px 14px', width: '100%', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.08em' }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '11px 14px', width: '100%', fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 11,
                background: loading ? 'rgba(0,229,255,0.4)' : 'linear-gradient(90deg,#00e5ff,#818cf8)',
                color: '#060910', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 28px rgba(0,229,255,0.25)',
                transition: 'all 0.2s', border: 'none',
              }}
            >
              {loading && <Spinner size={16} color="#060910" />}
              {loading ? 'Signing in…' : 'Sign In to Dashboard →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#00e5ff', fontWeight: 700 }}>Register free →</Link>
          </p>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#1e3355', fontSize: 11, fontFamily: 'var(--mono)' }}>
          © 2026 ResumeAI Pro · AI-Powered Career Intelligence
        </div>
      </div>
    </div>
  );
}

/* ── Register Page ── */
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const nav = useNavigate();
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Full name is required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const axios = (await import('axios')).default;
      await axios.post('/api/auth/register', { ...form, email: form.email.trim().toLowerCase() });
      toast.success('Account created! Please sign in.');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Try a different email.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)', top: -150, right: -150, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s ease', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#00e5ff,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 32px rgba(0,229,255,0.3)' }}>🧠</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em' }}>Resume<span style={{ color: '#00e5ff' }}>AI</span></div>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>PRO PLATFORM</div>
            </div>
          </div>
          <p style={{ color: '#475569', fontSize: 13, fontFamily: 'var(--mono)' }}>Create your free account</p>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
          <form onSubmit={submit}>
            {[['FULL NAME', 'text', 'name', 'Alex Johnson'], ['EMAIL ADDRESS', 'email', 'email', 'you@example.com'], ['PASSWORD', 'password', 'password', 'Min 6 characters']].map(([label, type, key, ph]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.08em' }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={ph}
                  required
                  minLength={key === 'password' ? 6 : undefined}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '11px 14px', width: '100%', fontSize: 14 }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', marginTop: 8, borderRadius: 11,
                background: loading ? 'rgba(0,229,255,0.4)' : 'linear-gradient(90deg,#00e5ff,#818cf8)',
                color: '#060910', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
              }}
            >
              {loading && <Spinner size={16} color="#060910" />}
              {loading ? 'Creating Account…' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00e5ff', fontWeight: 700 }}>Sign in →</Link>
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
            {['✅ Free forever', '✅ No credit card', '✅ AI-powered'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--mono)' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
