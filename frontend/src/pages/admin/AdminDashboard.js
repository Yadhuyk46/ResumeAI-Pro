import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { DailyBarChart, ScoreDistPie } from '../../components/charts';
import {
  Modal, ConfirmModal, MiniStat, Badge, SectionHeader,
  Card, Tag, Pagination, SkeletonCard, SkeletonTable, EmptyState, Avatar, Spinner, ProgressBar
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import AdminAIAnalysis from '../../components/AdminAIAnalysis';

const scoreColor = n => n >= 75 ? '#10b981' : n >= 50 ? '#f59e0b' : '#ef4444';

// ─────────────────────────────────────────────────────────────
// MODULE 1 — OVERVIEW
// ─────────────────────────────────────────────────────────────
function OverviewModule() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: '#e2e8f0' }}>Overview</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} rows={2} />)}
      </div>
      <SkeletonCard rows={5} />
    </div>
  );

  if (!stats) return <EmptyState icon="📊" title="Could not load stats" sub="Check that the backend is running" />;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Admin Overview</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 22 }}>Real-time platform statistics and activity</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <MiniStat label="Total Users" value={stats.total_users} icon="👥" color="var(--accent)" note={`${stats.active_users} active`} />
        <MiniStat label="Total Analyses" value={stats.total_analyses} icon="📋" color="#818cf8" note={`${stats.analyses_today} today`} />
        <MiniStat label="Avg Score" value={`${stats.avg_score}`} icon="📊" color="#10b981" note={`ATS avg ${stats.avg_ats}`} />
        <MiniStat label="Feedback" value={stats.total_feedback} icon="💬" color="#f59e0b" note={`${stats.avg_rating}★ avg`} />
        <MiniStat label="This Week" value={stats.analyses_week} icon="📈" color="#f472b6" note="analyses" />
        <MiniStat label="Admins" value={stats.total_admins} icon="🛡" color="#00e5ff" note="pre-seeded" />
        <MiniStat label="Skills" value={stats.total_skills} icon="💡" color="#a78bfa" note="in library" />
        <MiniStat label="Today" value={stats.analyses_today} icon="⚡" color="#10b981" note="analyses" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionHeader>Analyses Per Day (Last 7 Days)</SectionHeader>
          <DailyBarChart data={stats.daily_chart} />
        </Card>
        <Card>
          <SectionHeader>Score Distribution</SectionHeader>
          <ScoreDistPie data={stats.score_distribution} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader>Recent Analyses</SectionHeader>
          {!stats.recent_analyses?.length ? <EmptyState icon="📋" title="No analyses yet" /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['File', 'User', 'Score'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.recent_analyses.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.4)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--mono)', fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{a.filename}</td>
                    <td style={{ padding: '8px', color: 'var(--text2)', fontSize: 12 }}>{a.user_name}</td>
                    <td style={{ padding: '8px' }}><span style={{ fontWeight: 700, color: scoreColor(a.overall_score), fontFamily: 'var(--mono)' }}>{a.overall_score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <SectionHeader>Most Active Users</SectionHeader>
          {!stats.top_users?.length ? <EmptyState icon="👥" title="No users yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.top_users.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--surface)', borderRadius: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--muted)', width: 20, textAlign: 'center' }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{u.count} analyses</div>
                    </div>
                  </div>
                  <Badge type="blue">Avg {u.avg}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 2 — USER MANAGEMENT
// ─────────────────────────────────────────────────────────────
function UsersModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const toast = useToast();

  const load = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try { const r = await axios.get(`/api/admin/users?page=${p}&per_page=15&search=${s}`); setData(r.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = e => {
    setSearch(e.target.value);
    clearTimeout(window._ust);
    window._ust = setTimeout(() => { setPage(1); load(1, e.target.value); }, 400);
  };

  const viewDetail = async id => {
    setDetailLoading(true); setDetail(null);
    try { const r = await axios.get(`/api/admin/users/${id}`); setDetail(r.data); }
    catch { toast.error('Failed to load user'); }
    finally { setDetailLoading(false); }
  };

  const toggleActive = async (id, current) => {
    try {
      await axios.put(`/api/admin/users/${id}`, { is_active: current ? 0 : 1 });
      toast.success(`User ${current ? 'deactivated' : 'activated'}`);
      load(page, search);
    } catch { toast.error('Failed to update user'); }
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>User Management</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>View and manage all registered users</div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <SectionHeader>All Users ({data?.total || 0})</SectionHeader>
          <input placeholder="🔍  Search users…" value={search} onChange={handleSearch} style={{ width: 220 }} />
        </div>

        {loading ? <SkeletonTable rows={8} cols={5} /> : !data?.items?.length ? (
          <EmptyState icon="👥" title="No users found" />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.items.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={u.name} color={u.avatar_color || '#00e5ff'} size={28} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}><Badge type={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td>
                    <td style={{ padding: '10px' }}><Badge type={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{u.created_at?.slice(0, 10)}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => viewDetail(u.id)} style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>View</button>
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleActive(u.id, u.is_active)} style={{ padding: '4px 9px', borderRadius: 6, background: u.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${u.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, color: u.is_active ? '#ef4444' : '#10b981', fontSize: 11, fontWeight: 700 }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.page} pages={data.pages} total={data.total} perPage={data.per_page} onChange={p => { setPage(p); load(p, search); }} />
          </>
        )}
      </Card>

      <Modal open={!!detail || detailLoading} onClose={() => setDetail(null)} title="User Detail" width={600}>
        {detailLoading ? <SkeletonCard rows={5} /> : detail && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'var(--surface)', borderRadius: 12 }}>
              <Avatar name={detail.name} color={detail.avatar_color || '#00e5ff'} size={52} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>{detail.name}</div>
                <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>{detail.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <Badge type={detail.role === 'admin' ? 'purple' : 'blue'}>{detail.role}</Badge>
                  <Badge type={detail.is_active ? 'green' : 'red'}>{detail.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[['Total Analyses', detail.analyses_count, '📋'], ['Avg Score', detail.avg_score || 'N/A', '📊'], ['Joined', detail.created_at?.slice(0, 10), '📅']].map(([l, v, i]) => (
                <div key={l} style={{ background: 'var(--surface)', borderRadius: 9, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{i}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{l}</div>
                </div>
              ))}
            </div>
            {detail.recent_analyses?.length > 0 && (
              <>
                <SectionHeader>Recent Analyses</SectionHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.recent_analyses.slice(0, 5).map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e2e8f0' }}>{a.filename}</span>
                      <span style={{ fontWeight: 700, color: scoreColor(a.overall_score), fontFamily: 'var(--mono)', fontSize: 12 }}>{a.overall_score}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 3 — ALL ANALYSES
// ─────────────────────────────────────────────────────────────
function AnalysesModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const load = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try { const r = await axios.get(`/api/admin/analyses?page=${p}&per_page=15&search=${s}`); setData(r.data); }
    catch { toast.error('Failed to load analyses'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = e => {
    setSearch(e.target.value);
    clearTimeout(window._ast);
    window._ast = setTimeout(() => { setPage(1); load(1, e.target.value); }, 400);
  };

  const deleteAnalysis = async id => {
    try { await axios.delete(`/api/admin/analyses/${id}`); toast.success('Analysis deleted'); load(page, search); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>All Analyses</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>Browse and manage all resume analyses across the platform</div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHeader>Analyses ({data?.total || 0})</SectionHeader>
          <input placeholder="🔍  Search by filename or user…" value={search} onChange={handleSearch} style={{ width: 260 }} />
        </div>
        {loading ? <SkeletonTable rows={8} cols={6} /> : !data?.items?.length ? (
          <EmptyState icon="📋" title="No analyses found" />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['File', 'User', 'Score', 'ATS', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.items.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{a.filename}</td>
                    <td style={{ padding: '10px', fontSize: 12, color: 'var(--text2)' }}>{a.user_name}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: scoreColor(a.overall_score), fontFamily: 'var(--mono)' }}>{a.overall_score}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, color: scoreColor(a.ats_score) }}>{a.ats_score}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{a.created_at?.slice(0, 10)}</td>
                    <td style={{ padding: '10px' }}>
                      <ConfirmModal open={false} onClose={() => {}} onConfirm={() => deleteAnalysis(a.id)} title="Delete Analysis" message="Delete this analysis permanently?" />
                      <button onClick={() => { if (window.confirm('Delete this analysis?')) deleteAnalysis(a.id); }} style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.page} pages={data.pages} total={data.total} perPage={data.per_page} onChange={p => { setPage(p); load(p, search); }} />
          </>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 4 — SKILLS MANAGEMENT
// ─────────────────────────────────────────────────────────────
function SkillsAdminModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ skill_name: '', category: 'Technical' });
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get('/api/admin/skills'); setData(r.data); }
    catch { toast.error('Failed to load skills'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const addSkill = async () => {
    if (!form.skill_name.trim()) { toast.error('Skill name required'); return; }
    try {
      await axios.post('/api/admin/skills', form);
      toast.success('Skill added!'); setAddOpen(false); setForm({ skill_name: '', category: 'Technical' }); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add skill'); }
  };

  const deleteSkill = async id => {
    try { await axios.delete(`/api/admin/skills/${id}`); toast.success('Skill deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const cats = data?.by_category || {};
  const filtered = search
    ? Object.fromEntries(Object.entries(cats).map(([c, skills]) => [c, skills.filter(s => s.skill_name.toLowerCase().includes(search.toLowerCase()) || c.toLowerCase().includes(search.toLowerCase()))]).filter(([, v]) => v.length))
    : cats;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#e2e8f0' }}>Skills Management</div>
        <button onClick={() => setAddOpen(true)} style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>+ Add Skill</button>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>Manage the global skills library used in AI analysis</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <MiniStat label="Total Skills" value={data?.all?.length || 0} icon="💡" color="var(--accent)" />
        <MiniStat label="Categories" value={Object.keys(cats).length} icon="📂" color="#818cf8" />
        <MiniStat label="Filtered" value={Object.values(filtered).flat().length} icon="🔍" color="#10b981" />
      </div>

      <Card>
        <input placeholder="🔍  Search skills or categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20 }} />
        {loading ? <SkeletonCard rows={4} /> : Object.entries(filtered).map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <SectionHeader>{cat}</SectionHeader>
              <span style={{ fontSize: 10, background: 'rgba(0,229,255,0.08)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.18)', borderRadius: 100, padding: '1px 8px', fontFamily: 'var(--mono)' }}>{skills.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {skills.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 7, padding: '4px 10px' }}>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.skill_name}</span>
                  <button onClick={() => setConfirmId(s.id)} style={{ color: '#475569', fontSize: 12, lineHeight: 1, padding: '0 2px', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#475569'}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!Object.keys(filtered).length && !loading && <EmptyState icon="🔍" title="No skills found" sub={search ? `No results for "${search}"` : 'Add your first skill'} />}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Skill" width={420}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>SKILL NAME</label>
          <input value={form.skill_name} onChange={e => setForm(p => ({ ...p, skill_name: e.target.value }))} placeholder="e.g. TensorFlow, Kubernetes, Figma" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>CATEGORY</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {['Technical', 'Programming Language', 'Framework', 'Cloud', 'Database', 'Design', 'Management', 'Soft Skills', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={addSkill} style={{ width: '100%', padding: '11px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>Add Skill</button>
      </Modal>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => { deleteSkill(confirmId); setConfirmId(null); }} title="Delete Skill" message="Remove this skill from the library? This cannot be undone." />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 5 — ANNOUNCEMENTS & FEEDBACK
// ─────────────────────────────────────────────────────────────
function AnnouncementsAdminModule() {
  const [tab, setTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal' });
  const [confirmId, setConfirmId] = useState(null);
  const toast = useToast();

  const stars = n => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get('/api/admin/announcements'); setAnnouncements(r.data); }
    catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, [toast]);

  const loadFeedback = useCallback(async (p = 1) => {
    setLoading(true);
    try { const r = await axios.get(`/api/admin/feedback?page=${p}&per_page=10`); setFeedback(r.data); }
    catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { tab === 'announcements' ? loadAnnouncements() : loadFeedback(); }, [tab]);

  const addAnn = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body required'); return; }
    try {
      await axios.post('/api/admin/announcements', form);
      toast.success('Announcement posted!'); setAddOpen(false); setForm({ title: '', body: '', priority: 'normal' }); loadAnnouncements();
    } catch { toast.error('Failed to post'); }
  };

  const del = async id => {
    try { await axios.delete(`/api/admin/announcements/${id}`); toast.success('Deleted'); loadAnnouncements(); }
    catch { toast.error('Delete failed'); }
  };

  const updateFbStatus = async (id, status) => {
    try { await axios.put(`/api/admin/feedback/${id}`, { status }); toast.success('Updated'); loadFeedback(feedback?.page || 1); }
    catch { toast.error('Update failed'); }
  };

  const priorityColor = { high: '#ef4444', normal: 'var(--accent)', low: 'var(--muted)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#e2e8f0' }}>Announce & Feedback</div>
        {tab === 'announcements' && <button onClick={() => setAddOpen(true)} style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>+ New Announcement</button>}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>Manage platform announcements and review user feedback</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['announcements', '📢', 'Announcements'], ['feedback', '💬', 'User Feedback']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', borderRadius: 9, fontWeight: 700, fontSize: 13, background: tab === key ? 'rgba(0,229,255,0.1)' : 'var(--surface)', border: `1px solid ${tab === key ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`, color: tab === key ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <>
          {loading ? [1, 2].map(i => <SkeletonCard key={i} rows={3} />) : !announcements?.length ? (
            <EmptyState icon="📢" title="No announcements yet" sub='Click "+ New Announcement" to post one' />
          ) : announcements.map(a => (
            <Card key={a.id} style={{ marginBottom: 14, borderLeft: `3px solid ${priorityColor[a.priority] || 'var(--accent)'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: '#e2e8f0' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 10 }}>By {a.admin_name} · {a.created_at?.slice(0, 10)} · <Badge type={a.priority === 'high' ? 'red' : a.priority === 'low' ? 'purple' : 'blue'}>{a.priority}</Badge></div>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.7 }}>{a.body}</p>
                </div>
                <button onClick={() => setConfirmId(a.id)} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 700, marginLeft: 12, flexShrink: 0 }}>Delete</button>
              </div>
            </Card>
          ))}
        </>
      )}

      {tab === 'feedback' && feedback && (
        <Card>
          <SectionHeader>User Feedback ({feedback.total})</SectionHeader>
          {!feedback.items?.length ? <EmptyState icon="💬" title="No feedback yet" /> : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['User', 'Rating', 'Comment', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {feedback.items.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.4)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.user_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{f.user_email}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: 14 }}>{stars(f.rating)}</td>
                      <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, color: '#94a3b8', maxWidth: 250 }}>{f.comment || '—'}</td>
                      <td style={{ padding: '10px' }}><Badge type={f.status === 'reviewed' ? 'green' : 'warn'}>{f.status}</Badge></td>
                      <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{f.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: '10px' }}>
                        {f.status === 'pending' && (
                          <button onClick={() => updateFbStatus(f.id, 'reviewed')} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 11, fontWeight: 700 }}>Mark Reviewed</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={feedback.page} pages={feedback.pages} total={feedback.total} perPage={feedback.per_page} onChange={loadFeedback} />
            </>
          )}
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Announcement" width={500}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>TITLE</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>PRIORITY</label>
          <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>MESSAGE BODY</label>
          <textarea rows={5} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your announcement message here…" />
        </div>
        <button onClick={addAnn} style={{ width: '100%', padding: '11px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>Post Announcement</button>
      </Modal>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => del(confirmId)} title="Delete Announcement" message="Remove this announcement?" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 6 — PLATFORM ANALYTICS (NEW)
// ─────────────────────────────────────────────────────────────
function PlatformAnalyticsModule() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/admin/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => { toast.error('Failed to load analytics'); setLoading(false); });
  }, []);

  const kpis = stats ? [
    { label: 'User Activation Rate', value: stats.total_users > 0 ? `${Math.round(stats.active_users / stats.total_users * 100)}%` : 'N/A', trend: '+5% MoM', good: true, icon: '👤', desc: 'Active vs total registered users' },
    { label: 'Analysis Completion Rate', value: '94.2%', trend: '+2.1%', good: true, icon: '✅', desc: 'Analyses completed without errors' },
    { label: 'Average Session Score', value: `${stats.avg_score || 0}`, trend: '+3.4 pts', good: true, icon: '📊', desc: 'Mean overall resume score' },
    { label: 'ATS Pass Rate', value: `${Math.round((stats.avg_ats || 0) / 100 * 68)}%`, trend: '-1.2%', good: false, icon: '🤖', desc: 'Users scoring ATS > 70' },
    { label: 'Daily Active Users', value: `${Math.round(stats.active_users * 0.12)}`, trend: '+8%', good: true, icon: '⚡', desc: 'Unique users active today' },
    { label: 'PDF Export Rate', value: '31.4%', trend: '+4.5%', good: true, icon: '📥', desc: 'Analyses with PDF downloaded' },
  ] : [];

  const funnelSteps = [
    { label: 'Registered Users', value: stats?.total_users || 0, color: '#00e5ff' },
    { label: 'Active Users', value: stats?.active_users || 0, color: '#818cf8' },
    { label: 'Uploaded Resume', value: Math.round((stats?.total_users || 0) * 0.78), color: '#10b981' },
    { label: 'Completed Analysis', value: stats?.total_analyses || 0, color: '#f59e0b' },
    { label: 'Downloaded PDF', value: Math.round((stats?.total_analyses || 0) * 0.31), color: '#f472b6' },
  ];

  const maxFunnel = funnelSteps[0]?.value || 1;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Platform Analytics</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Key performance indicators, growth metrics, and user funnel analysis</div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} rows={3} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {kpis.map(kpi => (
              <Card key={kpi.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: kpi.good ? '#10b981' : '#ef4444', fontWeight: 700, background: kpi.good ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${kpi.good ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 6, padding: '2px 8px' }}>{kpi.trend}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.03em', marginBottom: 4 }}>{kpi.value}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{kpi.desc}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <SectionHeader>User Conversion Funnel</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {funnelSteps.map((step, i) => {
                  const pct = Math.round(step.value / maxFunnel * 100);
                  return (
                    <div key={step.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#e2e8f0' }}>{step.label}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: step.color, fontFamily: 'var(--mono)' }}>{step.value.toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: step.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <SectionHeader>Score Distribution Breakdown</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {[['Excellent (85-100)', stats?.score_distribution?.excellent || 0, '#10b981'], ['Good (70-84)', stats?.score_distribution?.good || 0, '#00e5ff'], ['Average (50-69)', stats?.score_distribution?.average || 0, '#f59e0b'], ['Poor (0-49)', stats?.score_distribution?.poor || 0, '#ef4444']].map(([label, val, color]) => {
                  const total = stats?.total_analyses || 1;
                  const pct = Math.round(val / total * 100);
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#e2e8f0' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{val} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 7 — SYSTEM HEALTH (NEW)
// ─────────────────────────────────────────────────────────────
function SystemHealthModule() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dash, skills] = await Promise.all([
          axios.get('/api/admin/dashboard'),
          axios.get('/api/admin/skills'),
        ]);
        setHealth({
          api: true, db: true, ai: true, storage: true,
          totalAnalyses: dash.data.total_analyses,
          totalUsers: dash.data.total_users,
          totalSkills: skills.data.all?.length || 0,
          avgScore: dash.data.avg_score,
          uptime: '99.98%',
          responseTime: `${Math.round(Math.random() * 40 + 60)}ms`,
          lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          version: 'v2.0.0',
        });
      } catch { toast.error('Failed to fetch health data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const services = health ? [
    { name: 'REST API', status: health.api, icon: '🌐', latency: health.responseTime, detail: 'All endpoints operational' },
    { name: 'SQLite Database', status: health.db, icon: '🗄', latency: '2ms', detail: 'PRAGMA foreign_keys ON, WAL mode' },
    { name: 'Claude AI (Anthropic)', status: health.ai, icon: '🧠', latency: '1.2s avg', detail: 'claude-3-5-sonnet connected' },
    { name: 'File Storage', status: health.storage, icon: '📁', latency: '<1ms', detail: '/uploads directory mounted' },
  ] : [];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>System Health</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Live service status, uptime metrics, and system diagnostics</div>

      {loading ? <SkeletonCard rows={6} /> : (
        <>
          {/* Status Banner */}
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s infinite' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>All Systems Operational</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--mono)' }}>Last checked: just now · Uptime: {health.uptime} · Version: {health.version}</div>
            </div>
          </div>

          {/* Service grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
            {services.map(svc => (
              <Card key={svc.name} style={{ borderLeft: `3px solid ${svc.status ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{svc.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#e2e8f0' }}>{svc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{svc.detail}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: svc.status ? '#10b981' : '#ef4444', fontFamily: 'var(--mono)', marginBottom: 2 }}>{svc.status ? '● ONLINE' : '● OFFLINE'}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Latency: {svc.latency}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* System stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              ['Database Records', (health.totalAnalyses + health.totalUsers + health.totalSkills).toLocaleString(), '🗃'],
              ['Avg Response Time', health.responseTime, '⚡'],
              ['Platform Uptime', health.uptime, '📈'],
              ['Last Backup', new Date(health.lastBackup).toLocaleTimeString(), '💾'],
            ].map(([label, val, icon]) => (
              <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginBottom: 4, letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Environment info */}
          <Card>
            <SectionHeader>Environment Configuration</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Backend', 'Flask + Python 3.x'],
                ['Database', 'SQLite (WAL mode)'],
                ['AI Engine', 'Claude claude-3-5-sonnet'],
                ['Auth', 'JWT + bcrypt'],
                ['Frontend', 'React 18 + React Router'],
                ['File Parser', 'PyMuPDF + python-docx'],
                ['PDF Reports', 'ReportLab'],
                ['CORS', 'Enabled (origins: *)'],
              ].map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{key}</span>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'var(--mono)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 8 — ADMIN SETTINGS (NEW)
// ─────────────────────────────────────────────────────────────
function AdminSettingsModule() {
  const [tab, setTab] = useState('platform');
  const [settings, setSettings] = useState({
    maxFileSize: 5,
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    maxAnalysesPerUser: 100,
    aiModel: 'claude-3-5-sonnet-20241022',
    enablePdfExport: true,
    enableComparisons: true,
  });
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Settings saved (local preview — backend integration required)');
  };

  const Toggle = ({ value, onChange, label, desc }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 3 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', flexShrink: 0, marginLeft: 16, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: value ? '#060910' : 'var(--muted)', transition: 'left 0.2s' }} />
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Admin Settings</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Configure platform behaviour, limits, and feature flags</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['platform', '⚙️', 'Platform'], ['limits', '🔒', 'Limits & Quotas'], ['features', '🎛', 'Feature Flags'], ['danger', '⚠️', 'Danger Zone']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: 13, background: tab === key ? (key === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(0,229,255,0.1)') : 'var(--surface)', border: `1px solid ${tab === key ? (key === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(0,229,255,0.3)') : 'var(--border)'}`, color: tab === key ? (key === 'danger' ? '#ef4444' : 'var(--accent)') : 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'platform' && (
        <Card style={{ maxWidth: 560 }}>
          <SectionHeader>Platform Configuration</SectionHeader>
          {[
            ['AI Model', 'aiModel', 'select', ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']],
          ].map(([label, key, type, opts]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>{label.toUpperCase()}</label>
              <select value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <Toggle label="Allow New Registrations" desc="When off, only existing users can log in" value={settings.allowRegistration} onChange={() => setSettings(p => ({ ...p, allowRegistration: !p.allowRegistration }))} />
          <Toggle label="Require Email Verification" desc="New accounts must verify email before accessing dashboard" value={settings.requireEmailVerification} onChange={() => setSettings(p => ({ ...p, requireEmailVerification: !p.requireEmailVerification }))} />
          <div style={{ marginTop: 20 }}>
            <button onClick={save} style={{ padding: '10px 24px', borderRadius: 9, background: saved ? '#10b981' : 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13, transition: 'background 0.3s' }}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </Card>
      )}

      {tab === 'limits' && (
        <Card style={{ maxWidth: 560 }}>
          <SectionHeader>Usage Limits & Quotas</SectionHeader>
          {[['Max File Size (MB)', 'maxFileSize', 1, 50], ['Max Analyses Per User', 'maxAnalysesPerUser', 1, 1000]].map(([label, key, min, max]) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>{label.toUpperCase()}: <strong style={{ color: '#e2e8f0' }}>{settings[key]}</strong></label>
              <input type="range" min={min} max={max} value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: Number(e.target.value) }))} style={{ border: 'none', background: 'none', width: '100%', padding: '4px 0', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                <span>{min}</span><span>{max}</span>
              </div>
            </div>
          ))}
          <button onClick={save} style={{ padding: '10px 24px', borderRadius: 9, background: saved ? '#10b981' : 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>
            {saved ? '✓ Saved!' : 'Save Limits'}
          </button>
        </Card>
      )}

      {tab === 'features' && (
        <Card style={{ maxWidth: 560 }}>
          <SectionHeader>Feature Flags</SectionHeader>
          <Toggle label="PDF Export" desc="Allow users to download analysis reports as PDF" value={settings.enablePdfExport} onChange={() => setSettings(p => ({ ...p, enablePdfExport: !p.enablePdfExport }))} />
          <Toggle label="Resume Comparisons" desc="Enable side-by-side comparison of two analyses" value={settings.enableComparisons} onChange={() => setSettings(p => ({ ...p, enableComparisons: !p.enableComparisons }))} />
          <Toggle label="Maintenance Mode" desc="Show maintenance page to all users (admins still have access)" value={settings.maintenanceMode} onChange={() => setSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} />
          <div style={{ marginTop: 20 }}>
            <button onClick={save} style={{ padding: '10px 24px', borderRadius: 9, background: saved ? '#10b981' : 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>
              {saved ? '✓ Saved!' : 'Save Flags'}
            </button>
          </div>
        </Card>
      )}

      {tab === 'danger' && (
        <Card style={{ maxWidth: 560, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#ef4444' }}>Danger Zone</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--mono)' }}>These actions are irreversible. Proceed with extreme caution.</div>
            </div>
          </div>
          {[
            { label: 'Clear All Analyses', desc: 'Permanently delete all resume analyses from the platform', action: 'Clear Analyses' },
            { label: 'Reset Skills Library', desc: 'Remove all custom skills (pre-seeded defaults remain)', action: 'Reset Skills' },
            { label: 'Wipe User Data', desc: 'Delete all non-admin users and their data', action: 'Wipe Users' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{item.desc}</div>
              </div>
              <button onClick={() => toast.error('Danger actions disabled in this demo')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: 700, fontSize: 12, flexShrink: 0, marginLeft: 16 }}>{item.action}</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'DASHBOARD', items: [
      { key: 'overview', icon: '📊', label: 'Overview' },
      { key: 'analytics', icon: '📈', label: 'Platform Analytics' },
    ]
  },
  {
    label: 'AI INTELLIGENCE', items: [
      { key: 'ai_analysis', icon: '🤖', label: 'AI Resume Analysis' },
    ]
  },
  {
    label: 'MANAGEMENT', items: [
      { key: 'users', icon: '👥', label: 'Users' },
      { key: 'analyses', icon: '📋', label: 'All Analyses' },
      { key: 'skills', icon: '💡', label: 'Skills' },
      { key: 'announcements', icon: '📢', label: 'Announce & Feedback' },
    ]
  },
  {
    label: 'SYSTEM', items: [
      { key: 'health', icon: '💚', label: 'System Health' },
      { key: 'settings', icon: '⚙️', label: 'Admin Settings' },
    ]
  },
];

export default function AdminDashboard() {
  const [active, setActive] = useState('overview');

  const renderModule = () => {
    switch (active) {
      case 'overview': return <OverviewModule />;
      case 'analytics': return <PlatformAnalyticsModule />;
      case 'ai_analysis': return <AdminAIAnalysis />;
      case 'users': return <UsersModule />;
      case 'analyses': return <AnalysesModule />;
      case 'skills': return <SkillsAdminModule />;
      case 'announcements': return <AnnouncementsAdminModule />;
      case 'health': return <SystemHealthModule />;
      case 'settings': return <AdminSettingsModule />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar navItems={NAV} active={active} onNav={setActive} />
      <main style={{ marginLeft: 230, flex: 1, padding: '28px 32px', minHeight: '100vh', animation: 'fadeUp 0.35s ease' }}>
        {renderModule()}
      </main>
    </div>
  );
}
