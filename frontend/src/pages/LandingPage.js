import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#060910', color: '#e2e8f0',
      fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0,
        background: 'rgba(6,9,16,0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#00e5ff,#6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: 18 }}>ResumeAI Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => nav('/login')}
            style={{ padding: '9px 20px', borderRadius: 9, background: 'transparent',
              border: '1px solid #1e293b', color: '#94a3b8', fontWeight: 600,
              fontSize: 13, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => nav('/register')}
            style={{ padding: '9px 20px', borderRadius: 9,
              background: 'linear-gradient(90deg,#00e5ff,#818cf8)',
              border: 'none', color: '#060910', fontWeight: 800,
              fontSize: 13, cursor: 'pointer',
              boxShadow: '0 0 24px rgba(0,229,255,0.25)' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 20,
          background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
          color: '#00e5ff', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, marginBottom: 28 }}>
          ⚡ Powered by Ollama llama3.2:3b — Local & Private
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px',
          background: 'linear-gradient(135deg,#e2e8f0 30%,#00e5ff 70%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI-Powered Resume<br />Analysis & Fixing
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, marginBottom: 40 }}>
          Upload your resume, get instant AI analysis, ATS score, keyword optimization,
          and professional fixes — all powered by a local AI model running on your machine.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => nav('/register')}
            style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 800,
              background: 'linear-gradient(90deg,#00e5ff,#818cf8)', border: 'none',
              color: '#060910', cursor: 'pointer', boxShadow: '0 0 32px rgba(0,229,255,0.3)' }}>
            🚀 Start Free Analysis
          </button>
          <button onClick={() => nav('/login')}
            style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b',
              color: '#94a3b8', cursor: 'pointer' }}>
            Sign In →
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: 20, padding: '0 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
        {[
          { icon: '⚡', title: 'Instant AI Analysis', desc: 'Get comprehensive resume scoring in seconds with 15+ metrics including ATS compatibility, readability, and impact.' },
          { icon: '🎨', title: '250 Pro Templates', desc: 'Choose from 250 professionally designed, ATS-optimized resume templates across 14 industry categories.' },
          { icon: '🤖', title: 'AI Assistant', desc: 'Chat with your personal AI resume coach for advice on keywords, formatting, career strategy, and more.' },
          { icon: '⬇', title: 'Download Fixed PDF', desc: 'Get a professionally formatted, ATS-ready PDF version of your AI-fixed resume ready to submit.' },
          { icon: '📊', title: 'Score Tracking', desc: 'Track your resume improvement over time with trend charts and historical score comparisons.' },
          { icon: '🔑', title: 'Keyword Optimizer', desc: 'Identify missing keywords for your target roles and optimize your resume for ATS systems.' },
        ].map((f, i) => (
          <div key={i} style={{ background: '#0d1117', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px 22px', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #1e293b',
        color: '#334155', fontSize: 12, fontFamily: 'monospace' }}>
        ResumeAI Pro — Built with Flask + React + Ollama llama3.2:3b
      </div>
    </div>
  );
}
