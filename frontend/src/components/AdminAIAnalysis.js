import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const scoreColor = n => n >= 75 ? '#10b981' : n >= 50 ? '#f59e0b' : '#ef4444';
const scoreLabel = n => n >= 80 ? 'Excellent' : n >= 65 ? 'Good' : n >= 45 ? 'Average' : 'Needs Work';

function Spinner({ size = 18, color = '#00e5ff' }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.65s linear infinite', flexShrink: 0,
    }} />
  );
}

function generateAIPrediction(user) {
  const avg    = user.avg_score    || 0;
  const count  = user.analysis_count || 0;
  const latest = user.latest_score || 0;

  const hireProbability = Math.min(95, Math.round(
    avg * 0.5 +
    Math.min(count * 3, 20) +
    (latest > avg ? 10 : 0) +
    (avg > 80 ? 15 : avg > 60 ? 8 : 0)
  ));

  let status, statusReason;
  if (avg >= 80) {
    status = 'APPROVED';
    statusReason = 'Strong resume quality consistently above 80. High ATS compatibility.';
  } else if (avg >= 60) {
    status = 'REVIEW';
    statusReason = 'Moderate quality. Some improvements needed for top-tier ATS.';
  } else {
    status = 'NEEDS_IMPROVEMENT';
    statusReason = 'Resume quality below threshold. Significant improvements required.';
  }

  const jobFits = avg >= 75
    ? [{ role: 'Senior Software Engineer', match: Math.min(97, avg+12), salary: '₹25–45 LPA' },
       { role: 'Product Manager',          match: Math.min(90, avg+5),  salary: '₹20–35 LPA' },
       { role: 'Tech Lead',                match: Math.min(93, avg+8),  salary: '₹22–40 LPA' }]
    : avg >= 55
    ? [{ role: 'Software Engineer',  match: Math.min(85, avg+10), salary: '₹12–22 LPA' },
       { role: 'Business Analyst',   match: Math.min(80, avg+5),  salary: '₹10–18 LPA' },
       { role: 'Data Analyst',       match: Math.min(78, avg+3),  salary: '₹8–16 LPA'  }]
    : [{ role: 'Junior Developer',   match: Math.min(70, avg+15), salary: '₹5–10 LPA' },
       { role: 'IT Support Analyst', match: Math.min(65, avg+10), salary: '₹4–8 LPA'  },
       { role: 'Fresher Program',    match: Math.min(60, avg+5),  salary: '₹3.5–6 LPA'}];

  return { hireProbability, status, statusReason, jobFits };
}

// ── Full detail modal for a single user ──
function UserDetailModal({ user, onClose }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const prediction = generateAIPrediction(user);
  const sc = {
    APPROVED:         { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10b981', icon: '✅' },
    REVIEW:           { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b', icon: '⚠️' },
    NEEDS_IMPROVEMENT:{ bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#ef4444', icon: '❌' },
  }[prediction.status];

  useEffect(() => {
    axios.get(`/api/admin/ai-analysis/user/${user.id}/analyses`)
      .then(r => setAnalyses(r.data))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(6,9,16,0.9)', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(8px)' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#0d1117', border:'1px solid #1e293b', borderRadius:20,
        width:'100%', maxWidth:760, maxHeight:'88vh', overflow:'auto', padding:28 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%',
              background: user.avatar_color||'linear-gradient(135deg,#00e5ff,#6d28d9)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:900, color:'#fff' }}>
              {user.name?.[0]||'?'}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:18, color:'#e2e8f0' }}>{user.name}</div>
              <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize:22, color:'#475569', background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>

        {/* AI Status */}
        <div style={{ background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ fontSize:18 }}>{sc.icon}</span>
            <span style={{ fontWeight:800, fontSize:14, color:sc.color }}>{prediction.status.replace(/_/g,' ')}</span>
            <span style={{ marginLeft:'auto', fontWeight:900, fontSize:22, color:sc.color }}>
              {prediction.hireProbability}%
            </span>
          </div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>{prediction.statusReason}</div>
        </div>

        {/* Score stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            ['Analyses',  user.analysis_count||0, '#00e5ff'],
            ['Avg Score', user.avg_score||0,        '#818cf8'],
            ['Best Score',user.best_score||0,        '#10b981'],
            ['Latest',    user.latest_score||0,      '#f59e0b'],
          ].map(([label,val,color]) => (
            <div key={label} style={{ background:'#0a0f1a', border:'1px solid #1e293b',
              borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color }}>{val}</div>
              <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace', marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Job fit predictions */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#00e5ff', fontFamily:'monospace', marginBottom:10 }}>
            AI JOB FIT PREDICTIONS
          </div>
          {prediction.jobFits.map((j,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', background:'#0a0f1a', border:'1px solid #1e293b',
              borderRadius:8, marginBottom:6 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#e2e8f0' }}>{j.role}</div>
                <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>{j.salary}</div>
              </div>
              <div style={{ fontWeight:900, fontSize:16, color: scoreColor(j.match) }}>{j.match}%</div>
            </div>
          ))}
        </div>

        {/* All analyses from DB */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#00e5ff', fontFamily:'monospace', marginBottom:10 }}>
            ALL UPLOADED ANALYSES ({analyses.length})
          </div>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:20 }}><Spinner /></div>
          ) : analyses.length === 0 ? (
            <div style={{ color:'#475569', fontSize:12, textAlign:'center', padding:20 }}>No analyses yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {analyses.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 14px', background:'#0a0f1a', border:'1px solid #1e293b', borderRadius:8 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:12, color:'#e2e8f0' }}>
                      📄 {a.filename}
                    </div>
                    <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace', marginTop:2 }}>
                      {a.candidate_name||'—'} · {a.current_role||'—'} · {a.created_at?.slice(0,10)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:900, fontSize:15, color: scoreColor(a.overall_score) }}>{a.overall_score||'N/A'}</div>
                      <div style={{ fontSize:9, color:'#475569' }}>Score</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:900, fontSize:15, color: scoreColor(a.ats_score) }}>{a.ats_score||'N/A'}</div>
                      <div style={{ fontSize:9, color:'#475569' }}>ATS</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card for one user in the grid ──
function UserAICard({ user, onViewFull }) {
  const prediction = generateAIPrediction(user);
  const sc = {
    APPROVED:         { bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.25)', color:'#10b981', icon:'✅' },
    REVIEW:           { bg:'rgba(245,158,11,0.08)',   border:'rgba(245,158,11,0.25)',  color:'#f59e0b', icon:'⚠️' },
    NEEDS_IMPROVEMENT:{ bg:'rgba(239,68,68,0.08)',    border:'rgba(239,68,68,0.25)',   color:'#ef4444', icon:'❌' },
  }[prediction.status];

  return (
    <div style={{ background:'#0d1117', border:`1px solid ${sc.border}`, borderRadius:16,
      overflow:'hidden', transition:'transform 0.15s, box-shadow 0.15s',
      cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 32px ${sc.color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
      onClick={() => onViewFull(user)}>

      {/* User row */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #1e293b',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:'50%',
            background:user.avatar_color||'linear-gradient(135deg,#00e5ff,#6d28d9)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>
            {user.name?.[0]||'?'}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'#e2e8f0' }}>{user.name}</div>
            <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>
              {user.analysis_count||0} analyses
            </div>
          </div>
        </div>
        <div style={{ background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:7,
          padding:'3px 9px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:11 }}>{sc.icon}</span>
          <span style={{ fontSize:9, fontWeight:800, color:sc.color, fontFamily:'monospace' }}>
            {prediction.status.replace(/_/g,' ')}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div style={{ padding:'12px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          {[
            ['Avg Score', user.avg_score||0],
            ['Latest',    user.latest_score||0],
            ['Hire%',     prediction.hireProbability],
          ].map(([label,val]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:18, color: scoreColor(val) }}>{val}</div>
              <div style={{ fontSize:9, color:'#475569', fontFamily:'monospace' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div style={{ height:4, background:'#1e293b', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${user.avg_score||0}%`,
            background:`linear-gradient(90deg,${sc.color},${sc.color}99)`,
            borderRadius:4, transition:'width 0.6s ease' }} />
        </div>

        {user.latest_file && (
          <div style={{ marginTop:8, fontSize:10, color:'#334155', fontFamily:'monospace',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            📄 {user.latest_file}
          </div>
        )}
        {user.latest_date && (
          <div style={{ fontSize:9, color:'#334155', fontFamily:'monospace', marginTop:2 }}>
            Last upload: {user.latest_date?.slice(0,10)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAIAnalysisModule() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilter]       = useState('All');
  const [sortBy,       setSort]         = useState('analyses');
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/admin/ai-analysis/users');
      setUsers(r.data);
    } catch {
      toast.error('Failed to load user AI analysis data');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users
    .filter(u => {
      const pred = generateAIPrediction(u);
      const matchSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || pred.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score')    return (b.avg_score||0)     - (a.avg_score||0);
      if (sortBy === 'analyses') return (b.analysis_count||0)- (a.analysis_count||0);
      if (sortBy === 'latest')   return (b.latest_score||0)  - (a.latest_score||0);
      return 0;
    });

  const totalApproved = users.filter(u => generateAIPrediction(u).status === 'APPROVED').length;
  const totalReview   = users.filter(u => generateAIPrediction(u).status === 'REVIEW').length;
  const totalNeeds    = users.filter(u => generateAIPrediction(u).status === 'NEEDS_IMPROVEMENT').length;
  const avgHire       = users.length
    ? Math.round(users.reduce((s,u) => s + generateAIPrediction(u).hireProbability, 0) / users.length)
    : 0;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#e2e8f0', marginBottom:4 }}>
          🤖 AI Resume Analysis — All Users
        </div>
        <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace' }}>
          Real-time AI intelligence from actual user uploads — live from database
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          ['Total Users',   users.length,   '#00e5ff'],
          ['✅ Approved',    totalApproved,  '#10b981'],
          ['⚠️ Review',      totalReview,    '#f59e0b'],
          ['Avg Hire%',      avgHire+'%',    '#818cf8'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:'#0d1117', border:'1px solid #1e293b',
            borderRadius:12, padding:'16px 18px' }}>
            <div style={{ fontSize:22, fontWeight:900, color, marginBottom:4 }}>{val}</div>
            <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20, alignItems:'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search users…"
          style={{ flex:1, minWidth:180, padding:'9px 14px', borderRadius:9,
            background:'#0d1117', border:'1px solid #1e293b', color:'#e2e8f0',
            fontSize:13, outline:'none' }}
        />
        {['All','APPROVED','REVIEW','NEEDS_IMPROVEMENT'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'8px 14px', borderRadius:8, fontSize:11, fontWeight:700,
              background: filterStatus===s ? '#00e5ff' : '#0d1117',
              color: filterStatus===s ? '#060910' : '#475569',
              border:`1px solid ${filterStatus===s ? '#00e5ff' : '#1e293b'}`,
              cursor:'pointer', fontFamily:'monospace' }}>
            {s.replace(/_/g,' ')}
          </button>
        ))}
        <select value={sortBy} onChange={e => setSort(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, background:'#0d1117',
            border:'1px solid #1e293b', color:'#e2e8f0', fontSize:12, cursor:'pointer' }}>
          <option value="analyses">Sort: Most Analyses</option>
          <option value="score">Sort: Avg Score</option>
          <option value="latest">Sort: Latest Score</option>
        </select>
        <button onClick={fetchUsers}
          style={{ padding:'8px 16px', borderRadius:8, background:'rgba(0,229,255,0.1)',
            border:'1px solid rgba(0,229,255,0.25)', color:'#00e5ff',
            fontSize:12, fontWeight:700, cursor:'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:200, gap:12 }}>
          <Spinner size={28} />
          <span style={{ color:'#475569', fontSize:13, fontFamily:'monospace' }}>Loading user AI data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#334155' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
          <div style={{ fontSize:14, fontWeight:700 }}>
            {users.length === 0 ? 'No users have uploaded resumes yet' : 'No users match filters'}
          </div>
          <div style={{ fontSize:11, fontFamily:'monospace', marginTop:6 }}>
            {users.length === 0
              ? 'Once users login and analyze their resumes, they will appear here'
              : 'Try adjusting your search or status filter'}
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {filtered.map(u => (
            <UserAICard key={u.id} user={u} onViewFull={setSelectedUser} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
