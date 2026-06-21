import React, { useState } from 'react';

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#00e5ff' }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.65s linear infinite',
    }} />
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card, #0d1117)',
      border: '1px solid var(--border, #1e293b)',
      borderRadius: 16, padding: '20px 22px', ...style
    }}>
      {children}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────
export function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: '#475569',
      fontFamily: 'monospace', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
const BADGE_STYLES = {
  blue:   { bg: 'rgba(0,229,255,0.1)',   border: 'rgba(0,229,255,0.25)',   color: '#00e5ff' },
  green:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  color: '#10b981' },
  red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   color: '#ef4444' },
  yellow: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  color: '#f59e0b' },
  purple: { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', color: '#818cf8' },
  gray:   { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', color: '#64748b' },
};
export function Badge({ children, type = 'blue' }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.blue;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      {children}
    </span>
  );
}

// ── Tag ───────────────────────────────────────────────────────
export function Tag({ children, color = '#00e5ff' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
      background: `${color}18`, border: `1px solid ${color}33`, color,
    }}>
      {children}
    </span>
  );
}

// ── ScoreBadge ────────────────────────────────────────────────
export function ScoreBadge({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      fontWeight: 900, fontSize: 14, color,
      fontFamily: 'monospace',
    }}>
      {score ?? 'N/A'}
    </span>
  );
}

// ── ScoreRing ─────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 80, stroke = 6 }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle"
        dominantBaseline="central" fill={color}
        fontSize={size * 0.22} fontWeight="900" fontFamily="monospace"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  );
}

// ── ProgressBar ───────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, color = '#00e5ff', height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: height / 2,
        background: `linear-gradient(90deg,${color},${color}bb)`,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

// ── MiniStat ──────────────────────────────────────────────────
export function MiniStat({ label, value, icon, color = '#00e5ff', note }) {
  return (
    <div style={{
      background: 'var(--card, #0d1117)',
      border: '1px solid var(--border, #1e293b)',
      borderRadius: 14, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {note && <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{note}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'Nothing here', subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#334155' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{subtitle}</div>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name = '?', color = '#00e5ff', size = 36 }) {
  const bg = color.startsWith('linear') || color.startsWith('#')
    ? (color.startsWith('#') ? undefined : undefined)
    : undefined;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color.startsWith('linear') ? color : `${color}33`,
      border: `2px solid ${color.startsWith('linear') ? 'rgba(255,255,255,0.2)' : color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#fff',
    }}>
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ page, pages, total, perPage, onChange }) {
  if (!pages || pages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border, #1e293b)' }}>
      <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
        {start}–{end} of {total}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: 'var(--surface, #0a0f1a)', border: '1px solid var(--border, #1e293b)',
            color: page <= 1 ? '#334155' : '#e2e8f0', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
          ‹
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                background: p === page ? '#00e5ff' : 'var(--surface, #0a0f1a)',
                border: `1px solid ${p === page ? '#00e5ff' : 'var(--border, #1e293b)'}`,
                color: p === page ? '#060910' : '#94a3b8', cursor: 'pointer' }}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page >= pages}
          style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: 'var(--surface, #0a0f1a)', border: '1px solid var(--border, #1e293b)',
            color: page >= pages ? '#334155' : '#e2e8f0', cursor: page >= pages ? 'not-allowed' : 'pointer' }}>
          ›
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,16,0.85)', zIndex: 1500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--card, #0d1117)', border: '1px solid var(--border, #1e293b)',
        borderRadius: 18, width: '100%', maxWidth: width, maxHeight: '88vh',
        overflow: 'auto', padding: 26, animation: 'fadeUp 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>{title}</div>
          <button onClick={onClose} style={{ fontSize: 20, color: '#475569',
            background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm', message, danger = false }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 9,
          background: 'var(--surface, #0a0f1a)', border: '1px solid var(--border, #1e293b)',
          color: '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} style={{ padding: '8px 18px', borderRadius: 9,
          background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,255,0.15)',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'rgba(0,229,255,0.4)'}`,
          color: danger ? '#ef4444' : '#00e5ff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────
export function SkeletonCard({ rows = 4 }) {
  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 16, borderRadius: 8, marginBottom: 10,
          background: 'linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
          width: `${[100,80,65,90][i % 4]}%` }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ── SkeletonTable ─────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 12, padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{ flex: 1, height: 14, borderRadius: 6,
              background: 'linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ))}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ── Global styles injection ────────────────────────────────────
export function GlobalStyles() {
  return (
    <style>{`
      :root {
        --bg: #060910; --card: #0d1117; --surface: #0a0f1a;
        --border: #1e293b; --text: #e2e8f0; --text2: #94a3b8;
        --muted: #475569; --accent: #00e5ff; --mono: 'Fira Code', 'JetBrains Mono', monospace;
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; }
      input, textarea, select {
        background: var(--card); border: 1px solid var(--border);
        color: var(--text); border-radius: 8px; padding: 8px 12px;
        font-family: inherit; font-size: 13px; outline: none;
        transition: border-color 0.15s;
      }
      input:focus, textarea:focus, select:focus { border-color: var(--accent); }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    `}</style>
  );
}
