import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { ScoreTrendChart, SectionRadarChart, CompareBarChart } from '../../components/charts';
import {
  Modal, ConfirmModal, ScoreRing, Badge, MiniStat, ProgressBar,
  EmptyState, Spinner, SectionHeader, Card, Tag, Pagination,
  SkeletonCard, SkeletonTable, ScoreBadge, Avatar
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import TemplateGallery from '../../components/TemplateGallery';

const scoreColor = n => n >= 75 ? '#10b981' : n >= 50 ? '#f59e0b' : '#ef4444';

// ─────────────────────────────────────────────────────────────
// MODULE 1 — ANALYZE
// ─────────────────────────────────────────────────────────────
function AnalyzeModule({ onAnalysisDone }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadMsg, setLoadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fbForm, setFbForm] = useState({ rating: 5, comment: '' });
  const fileRef = useRef();
  const toast = useToast();
  const msgs = ['Extracting text & structure…', 'Running AI analysis…', 'Scoring ATS compatibility…', 'Evaluating keywords…', 'Generating recommendations…'];

  const handleFile = f => {
    const allowed = ['pdf', 'docx', 'txt'];
    const ext = f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { toast.error('Only PDF, DOCX, TXT supported'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    setFile(f);
  };

  const analyze = async () => {
    if (!file) { toast.error('Please select a resume file'); return; }
    setLoading(true); setResult(null);
    let i = 0; setLoadMsg(msgs[0]);
    const iv = setInterval(() => { i = (i + 1) % msgs.length; setLoadMsg(msgs[i]); }, 2200);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('job_description', jd);
      const r = await axios.post('/api/user/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data.data);
      toast.success('Analysis complete!');
      onAnalysisDone?.();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed. Please retry.');
    } finally { clearInterval(iv); setLoading(false); setLoadMsg(''); }
  };

  const exportPDF = async () => {
    if (!result?.analysis_id) return;
    setExportLoading(true);
    try {
      const r = await axios.get(`/api/user/analyses/${result.analysis_id}/export-pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `ResumeAI_Report_${file?.name?.replace(/\.[^.]+$/, '')}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('PDF report downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  };

  const submitFeedback = async () => {
    if (!fbForm.comment.trim()) { toast.error('Please add a comment'); return; }
    try {
      await axios.post('/api/user/feedback', { ...fbForm, analysis_id: result?.analysis_id, rating: Number(fbForm.rating) });
      toast.success('Thank you for your feedback!');
      setFeedbackOpen(false); setFbForm({ rating: 5, comment: '' });
    } catch { toast.error('Failed to submit feedback'); }
  };

  const reset = () => { setResult(null); setFile(null); setJd(''); };

  if (result) return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Analysis Complete</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>{result.candidate_name} · {result.current_role} · {result.industry}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFeedbackOpen(true)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)', color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>💬 Feedback</button>
          <button onClick={exportPDF} disabled={exportLoading} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.22)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {exportLoading ? <Spinner size={13} color="#00e5ff" /> : '⬇'} Export PDF
          </button>
          <button onClick={reset} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 12, fontWeight: 700 }}>← New Analysis</button>
        </div>
      </div>

      <div style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.14)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.75 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>AI Summary: </span>{result.summary}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 20 }}>
        {[['Overall', result.overall_score], ['ATS', result.ats_score], ['Readability', result.readability_score], ['Impact', result.impact_score], ['Format', result.format_score], ['Job Match', result.job_match_score]].map(([l, v]) => (
          <Card key={l} style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: v != null ? scoreColor(v) : 'var(--muted)', lineHeight: 1 }}>{v ?? 'N/A'}</div>
            {v != null && <div style={{ marginTop: 6 }}><ProgressBar value={v} /></div>}
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionHeader>Section Breakdown</SectionHeader>
          <SectionRadarChart sections={result.sections} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {Object.entries({ contact_info: [10, 'Contact'], work_experience: [25, 'Experience'], education: [15, 'Education'], skills: [20, 'Skills'], projects: [15, 'Projects'], achievements: [15, 'Achievements'] }).map(([k, [max, label]]) => {
              const v = result.sections?.[k] || 0;
              return (
                <div key={k} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(Math.round(v / max * 100)) }}>{v}/{max}</span>
                  </div>
                  <ProgressBar value={v} max={max} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader>Strengths</SectionHeader>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {(result.strengths || []).map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: 'var(--mono)', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }}>▸</span>{s}
              </li>
            ))}
          </ul>
          <SectionHeader>Weaknesses</SectionHeader>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(result.weaknesses || []).map((w, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: 'var(--mono)', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ color: '#ef4444', marginTop: 1, flexShrink: 0 }}>▸</span>{w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader>Keywords Found</SectionHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {(result.keywords_found || []).map(k => <Tag key={k} color="green">{k}</Tag>)}
          </div>
          {result.keywords_missing?.length > 0 && <>
            <SectionHeader>Keywords Missing</SectionHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.keywords_missing.map(k => <Tag key={k} color="red">{k}</Tag>)}
            </div>
          </>}
        </Card>
        <Card>
          <SectionHeader>Recommendations</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(result.recommendations || []).slice(0, 5).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface)', borderRadius: 8, padding: '9px 12px' }}>
                <Badge type={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'warn' : 'green'}>{r.priority}</Badge>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Rate This Analysis" width={440}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>RATING: {'⭐'.repeat(Number(fbForm.rating))} ({fbForm.rating}/5)</label>
          <input type="range" min={1} max={5} value={fbForm.rating} onChange={e => setFbForm(p => ({ ...p, rating: e.target.value }))} style={{ border: 'none', background: 'none', padding: '4px 0', width: '100%', cursor: 'pointer' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>COMMENT</label>
          <textarea rows={4} value={fbForm.comment} onChange={e => setFbForm(p => ({ ...p, comment: e.target.value }))} placeholder="How accurate was the analysis? Any suggestions?" />
        </div>
        <button onClick={submitFeedback} style={{ width: '100%', padding: '10px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>Submit Feedback</button>
      </Modal>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Analyze Resume</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Upload a resume to get a comprehensive AI-powered analysis</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <SectionHeader>Upload Resume</SectionHeader>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : file ? '#10b981' : 'var(--border)'}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: dragOver ? 'rgba(0,229,255,0.04)' : file ? 'rgba(16,185,129,0.04)' : 'transparent', marginBottom: 14 }}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? '✅' : '📄'}</div>
            {file ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#10b981', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#e2e8f0' }}>Drop your resume here</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>PDF, DOCX, TXT · Max 5MB</div>
              </>
            )}
          </div>
          {file && <button onClick={() => setFile(null)} style={{ fontSize: 11, color: '#ef4444', fontFamily: 'var(--mono)', marginBottom: 10 }}>✕ Remove file</button>}
        </Card>

        <Card>
          <SectionHeader>Job Description (Optional)</SectionHeader>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description here for tailored match scoring and keyword analysis…" rows={8} style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>📌 Adding a JD enables job match score and targeted keyword gap analysis</div>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={analyze} disabled={loading || !file} style={{
          padding: '13px 32px', borderRadius: 11, fontWeight: 900, fontSize: 15,
          background: !file || loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(90deg,#00e5ff,#818cf8)',
          color: !file || loading ? 'var(--muted)' : '#060910',
          border: !file || loading ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          cursor: !file || loading ? 'not-allowed' : 'pointer',
          boxShadow: file && !loading ? '0 0 32px rgba(0,229,255,0.2)' : 'none',
        }}>
          {loading ? <><Spinner size={18} />{loadMsg || 'Analyzing…'}</> : <><span>⚡</span> Analyze with AI</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 2 — HISTORY
// ─────────────────────────────────────────────────────────────
function HistoryModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [stats, setStats] = useState(null);
  const toast = useToast();

  const load = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const [r, st] = await Promise.all([
        axios.get(`/api/user/analyses?page=${p}&per_page=10&search=${s}`),
        axios.get('/api/user/stats'),
      ]);
      setData(r.data); setStats(st.data);
    } catch { toast.error('Failed to load analyses'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = e => {
    setSearch(e.target.value);
    clearTimeout(window._st);
    window._st = setTimeout(() => { setPage(1); load(1, e.target.value); }, 400);
  };

  const viewDetail = async id => {
    setDetailLoading(true); setDetail(null);
    try { const r = await axios.get(`/api/user/analyses/${id}`); setDetail(r.data); }
    catch { toast.error('Failed to load details'); }
    finally { setDetailLoading(false); }
  };

  const deleteAnalysis = async id => {
    try { await axios.delete(`/api/user/analyses/${id}`); toast.success('Analysis deleted'); load(page, search); }
    catch { toast.error('Delete failed'); }
  };

  const exportPDF = async (id, filename) => {
    try {
      const r = await axios.get(`/api/user/analyses/${id}/export-pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `ResumeAI_${filename?.replace(/\.[^.]+$/, '')}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('PDF exported!');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>My Analyses</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>All your past resume analyses with history and trends</div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <MiniStat label="Total Analyses" value={stats.total} icon="📋" color="var(--accent)" />
          <MiniStat label="Avg Score" value={stats.avg_score} icon="📊" color="#818cf8" />
          <MiniStat label="Best Score" value={stats.best_score} icon="🏆" color="#10b981" />
          <MiniStat label="Avg ATS" value={stats.avg_ats} icon="🤖" color="#f59e0b" />
        </div>
      )}

      {stats?.trend?.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <SectionHeader>Score Trend Over Time</SectionHeader>
          <ScoreTrendChart data={stats.trend} />
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <SectionHeader>All Uploads</SectionHeader>
          <input placeholder="🔍  Search…" value={search} onChange={handleSearch} style={{ width: 220 }} />
        </div>

        {loading ? <SkeletonTable rows={6} cols={5} /> : !data?.items?.length ? (
          <EmptyState icon="📭" title="No analyses yet" sub="Upload your first resume to get started" />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['File', 'Candidate', 'Score', 'ATS', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.items.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{a.filename}</td>
                    <td style={{ padding: '10px', fontSize: 12, color: 'var(--text2)' }}>{a.candidate_name || '—'}</td>
                    <td style={{ padding: '10px' }}><span style={{ fontWeight: 700, color: scoreColor(a.overall_score), fontFamily: 'var(--mono)' }}>{a.overall_score}</span></td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 12, color: scoreColor(a.ats_score) }}>{a.ats_score}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{a.created_at?.slice(0, 10)}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => viewDetail(a.id)} style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>View</button>
                        <button onClick={() => exportPDF(a.id, a.filename)} style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8', fontSize: 11, fontWeight: 700 }}>PDF</button>
                        <button onClick={() => setConfirmId(a.id)} style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}>✕</button>
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

      <Modal open={!!detail || detailLoading} onClose={() => setDetail(null)} title="Analysis Detail" width={680}>
        {detailLoading ? <SkeletonCard rows={5} /> : detail && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <ScoreRing score={detail.overall_score} size={80} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>{detail.result?.candidate_name}</div>
                <div style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 12, margin: '3px 0' }}>{detail.result?.current_role}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge type="blue">ATS: {detail.ats_score}</Badge>
                  <Badge type="green">Read: {detail.readability_score}</Badge>
                  {detail.job_match_score && <Badge type="purple">Match: {detail.job_match_score}</Badge>}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16, background: 'rgba(0,229,255,0.04)', borderRadius: 9, padding: '12px 14px' }}>{detail.result?.summary}</div>
            <SectionHeader>Top Skills</SectionHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {(detail.result?.top_skills || []).map(s => <Tag key={s} color="blue">{s}</Tag>)}
            </div>
            <SectionHeader>Recommendations</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(detail.result?.recommendations || []).slice(0, 4).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, background: 'var(--surface)', borderRadius: 8, padding: '9px 12px' }}>
                  <Badge type={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'warn' : 'green'}>{r.priority}</Badge>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#94a3b8' }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => deleteAnalysis(confirmId)}
        title="Delete Analysis" message="This will permanently delete this analysis and cannot be undone." />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 3 — COMPARE
// ─────────────────────────────────────────────────────────────
function CompareModule() {
  const [analyses, setAnalyses] = useState([]);
  const [sel, setSel] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { axios.get('/api/user/analyses?per_page=50').then(r => setAnalyses(r.data.items || [])).catch(() => {}); }, []);

  const toggle = id => setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev);

  const compare = async () => {
    if (sel.length !== 2) { toast.error('Select exactly 2 analyses'); return; }
    setLoading(true);
    try { const r = await axios.post('/api/user/compare', { ids: sel }); setResult(r.data); }
    catch { toast.error('Comparison failed'); }
    finally { setLoading(false); }
  };

  const metrics = [['Overall Score', 'overall_score'], ['ATS Score', 'ats_score'], ['Readability', 'readability_score'], ['Job Match', 'job_match_score']];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Compare Resumes</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>Side-by-side comparison of two resume analyses</div>

      <Card style={{ marginBottom: 20 }}>
        <SectionHeader>Select 2 Analyses to Compare</SectionHeader>
        {!analyses.length ? <EmptyState icon="📋" title="No analyses yet" sub="Upload at least 2 resumes first" /> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10, marginBottom: 14 }}>
              {analyses.map(a => {
                const isSelected = sel.includes(a.id);
                const idx = sel.indexOf(a.id);
                return (
                  <div key={a.id} onClick={() => toggle(a.id)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.18s', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'rgba(0,229,255,0.06)' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e2e8f0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</span>
                      {isSelected && <span style={{ background: 'var(--accent)', color: '#060910', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{idx + 1}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge type="blue">{a.overall_score}/100</Badge>
                      <Badge type="green">ATS {a.ats_score}</Badge>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 5 }}>{a.created_at?.slice(0, 10)}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={compare} disabled={sel.length !== 2 || loading} style={{ padding: '9px 22px', borderRadius: 9, fontWeight: 800, fontSize: 13, background: sel.length === 2 ? 'linear-gradient(90deg,#00e5ff,#818cf8)' : 'var(--surface)', color: sel.length === 2 ? '#060910' : 'var(--muted)', border: sel.length !== 2 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading && <Spinner size={14} />} Compare Selected ({sel.length}/2)
            </button>
          </>
        )}
      </Card>

      {result && (
        <div style={{ animation: 'fadeUp 0.35s ease' }}>
          <CompareBarChart analyses={result.analyses} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            {result.analyses.map((a, i) => (
              <Card key={i} style={{ borderTop: `3px solid ${i === 0 ? 'var(--accent)' : '#6d28d9'}` }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14, color: '#e2e8f0' }}>{i === 0 ? '① ' : '② '}{a.filename}</div>
                <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)', marginBottom: 14 }}>{a.created_at?.slice(0, 10)}</div>
                {metrics.map(([label, key]) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: a[key] != null ? scoreColor(a[key]) : 'var(--muted)', fontFamily: 'var(--mono)' }}>{a[key] ?? 'N/A'}</span>
                    </div>
                    {a[key] != null && <ProgressBar value={a[key]} />}
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <SectionHeader>Top Skills</SectionHeader>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(a.result?.top_skills || []).map(s => <Tag key={s} color={i === 0 ? 'blue' : 'purple'}>{s}</Tag>)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 4 — SKILLS LIBRARY
// ─────────────────────────────────────────────────────────────
function SkillsModule() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get('/api/user/skills').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const cats = data?.by_category || {};
  const filtered = search
    ? Object.fromEntries(Object.entries(cats).map(([c, skills]) => [c, skills.filter(s => s.skill_name.toLowerCase().includes(search.toLowerCase()))]).filter(([, v]) => v.length))
    : cats;
  const total = data?.all?.length || 0;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Skills Library</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 20 }}>Browse {total} recognized skills used in AI analysis</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <MiniStat label="Total Skills" value={total} icon="💡" color="var(--accent)" />
        <MiniStat label="Categories" value={Object.keys(cats).length} icon="📂" color="#818cf8" />
        <MiniStat label="Showing" value={Object.values(filtered).flat().length} icon="🔍" color="#10b981" />
        <MiniStat label="Popular" value="Python" icon="⭐" color="#f59e0b" />
      </div>
      <Card>
        <input placeholder="🔍  Search skills…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20 }} />
        {loading ? <SkeletonCard rows={4} /> : Object.entries(filtered).map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <SectionHeader>{cat}</SectionHeader>
              <span style={{ fontSize: 10, background: 'rgba(0,229,255,0.08)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.18)', borderRadius: 100, padding: '1px 8px', fontFamily: 'var(--mono)' }}>{skills.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {skills.map(s => <Tag key={s.id} color="blue">{s.skill_name}</Tag>)}
            </div>
          </div>
        ))}
        {!Object.keys(filtered).length && <EmptyState icon="🔍" title="No skills found" sub={`No results for "${search}"`} />}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 5 — ANNOUNCEMENTS & FEEDBACK
// ─────────────────────────────────────────────────────────────
function AnnouncementsModule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fbOpen, setFbOpen] = useState(false);
  const [fbForm, setFbForm] = useState({ rating: 5, comment: '' });
  const toast = useToast();

  useEffect(() => { axios.get('/api/user/announcements').then(r => { setItems(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const submitFb = async () => {
    if (!fbForm.comment.trim()) { toast.error('Comment required'); return; }
    try {
      await axios.post('/api/user/feedback', { ...fbForm, rating: Number(fbForm.rating) });
      toast.success('Feedback submitted!'); setFbOpen(false); setFbForm({ rating: 5, comment: '' });
    } catch { toast.error('Submission failed'); }
  };

  const priorityStyle = { high: ['#ef4444', 'rgba(239,68,68,0.08)'], normal: ['var(--accent)', 'rgba(0,229,255,0.04)'], low: ['var(--muted)', 'rgba(71,85,105,0.1)'] };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Announcements</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>Updates and news from the ResumeAI team</div>
        </div>
        <button onClick={() => setFbOpen(true)} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)', color: '#a78bfa', fontSize: 13, fontWeight: 700 }}>💬 Give Feedback</button>
      </div>
      {loading ? [1, 2, 3].map(i => <SkeletonCard key={i} rows={3} />) : !items.length
        ? <EmptyState icon="📢" title="No announcements" sub="Check back later for updates" />
        : items.map(a => {
          const [col, bg] = priorityStyle[a.priority] || priorityStyle.normal;
          return (
            <Card key={a.id} style={{ marginBottom: 14, borderLeft: `3px solid ${col}`, background: bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, color: '#e2e8f0' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>By {a.admin_name} · {a.created_at?.slice(0, 10)}</div>
                </div>
                <Badge type={a.priority === 'high' ? 'red' : a.priority === 'low' ? 'purple' : 'blue'}>{a.priority}</Badge>
              </div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.75 }}>{a.body}</p>
            </Card>
          );
        })}
      <Modal open={fbOpen} onClose={() => setFbOpen(false)} title="Share Feedback" width={440}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>RATING: {'⭐'.repeat(Number(fbForm.rating))} ({fbForm.rating}/5)</label>
          <input type="range" min={1} max={5} value={fbForm.rating} onChange={e => setFbForm(p => ({ ...p, rating: e.target.value }))} style={{ border: 'none', background: 'none', padding: '4px 0', width: '100%', cursor: 'pointer' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>YOUR FEEDBACK</label>
          <textarea rows={4} value={fbForm.comment} onChange={e => setFbForm(p => ({ ...p, comment: e.target.value }))} placeholder="What do you think? Any suggestions?" />
        </div>
        <button onClick={submitFb} style={{ width: '100%', padding: '10px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>Submit Feedback</button>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 6 — PROFILE & SETTINGS
// ─────────────────────────────────────────────────────────────
function ProfileModule() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [tab, setTab] = useState('profile');
  const colors = ['#00e5ff', '#6d28d9', '#10b981', '#f59e0b', '#ef4444', '#818cf8', '#f472b6', '#34d399'];

  const saveProfile = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      await axios.put('/api/user/profile', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (e) { toast.error(e.response?.data?.error || 'Update failed'); }
    finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) { toast.error('Fill all password fields'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('New passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      await axios.put('/api/user/password', { current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.error || 'Password change failed'); }
    finally { setPwLoading(false); }
  };

  const setAvatarColor = async color => {
    try {
      await axios.put('/api/user/profile', { avatar_color: color });
      await refreshUser();
      toast.success('Avatar color updated!');
    } catch { toast.error('Failed to update color'); }
  };

  const tabs = [['profile', '👤', 'Profile'], ['security', '🔒', 'Security'], ['preferences', '⚙️', 'Preferences']];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Profile & Settings</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Manage your account, security, and preferences</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', borderRadius: 9, fontWeight: 700, fontSize: 13, background: tab === key ? 'rgba(0,229,255,0.1)' : 'var(--surface)', border: `1px solid ${tab === key ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`, color: tab === key ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <SectionHeader>Personal Information</SectionHeader>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>FULL NAME</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>EMAIL ADDRESS</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="your@email.com" />
            </div>
            <button onClick={saveProfile} disabled={loading} style={{ padding: '10px 22px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading && <Spinner size={14} />} Save Changes
            </button>
          </Card>

          <Card>
            <SectionHeader>Avatar Color</SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar name={user?.name} color={user?.avatar_color || '#00e5ff'} size={56} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{user?.email}</div>
                <div style={{ marginTop: 4 }}><Badge type="blue">{user?.role}</Badge></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {colors.map(c => (
                <div key={c} onClick={() => setAvatarColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: user?.avatar_color === c ? '3px solid #fff' : '2px solid transparent', transition: 'transform 0.15s', transform: user?.avatar_color === c ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'security' && (
        <Card style={{ maxWidth: 480 }}>
          <SectionHeader>Change Password</SectionHeader>
          {[['CURRENT PASSWORD', 'current', 'Enter current password'], ['NEW PASSWORD', 'newPw', 'Min 6 characters'], ['CONFIRM NEW PASSWORD', 'confirm', 'Repeat new password']].map(([label, key, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type="password" value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
          <button onClick={changePassword} disabled={pwLoading} style={{ padding: '10px 22px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            {pwLoading && <Spinner size={14} />} Change Password
          </button>
        </Card>
      )}

      {tab === 'preferences' && (
        <Card style={{ maxWidth: 480 }}>
          <SectionHeader>Notification Preferences</SectionHeader>
          {[['Email me analysis results', true], ['Weekly digest emails', false], ['Product announcements', true]].map(([label, def], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>{label}</span>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: def ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 2, left: def ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: def ? '#060910' : 'var(--muted)', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(0,229,255,0.04)', borderRadius: 9, border: '1px solid rgba(0,229,255,0.1)', fontSize: 12, color: '#94a3b8', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
            ℹ️ Preference saving coming soon. These are display-only for now.
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 7 — CAREER GOALS
// ─────────────────────────────────────────────────────────────
function CareerGoalsModule() {
  const [goals, setGoals] = useState([
    { id: 1, title: 'Reach 85+ Resume Score', target: 85, current: 72, deadline: '2024-06-30', status: 'in_progress' },
    { id: 2, title: 'Apply to 10 Senior Roles', target: 10, current: 4, deadline: '2024-07-15', status: 'in_progress' },
    { id: 3, title: 'Get ATS Score Above 90', target: 90, current: 91, deadline: '2024-05-31', status: 'completed' },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', target: '', current: '', deadline: '' });
  const toast = useToast();

  const addGoal = () => {
    if (!form.title.trim()) { toast.error('Goal title required'); return; }
    const newGoal = { id: Date.now(), title: form.title, target: Number(form.target) || 100, current: Number(form.current) || 0, deadline: form.deadline, status: 'in_progress' };
    setGoals(g => [...g, newGoal]);
    setForm({ title: '', target: '', current: '', deadline: '' });
    setAddOpen(false);
    toast.success('Goal added!');
  };

  const deleteGoal = id => { setGoals(g => g.filter(x => x.id !== id)); toast.success('Goal removed'); };
  const toggleComplete = id => setGoals(g => g.map(x => x.id === id ? { ...x, status: x.status === 'completed' ? 'in_progress' : 'completed' } : x));

  const statusColors = { completed: '#10b981', in_progress: '#00e5ff', paused: '#f59e0b' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#e2e8f0' }}>Career Goals</div>
        <button onClick={() => setAddOpen(true)} style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>+ Add Goal</button>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Track your career milestones and resume improvement targets</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <MiniStat label="Total Goals" value={goals.length} icon="🎯" color="var(--accent)" />
        <MiniStat label="Completed" value={goals.filter(g => g.status === 'completed').length} icon="✅" color="#10b981" />
        <MiniStat label="In Progress" value={goals.filter(g => g.status === 'in_progress').length} icon="⏳" color="#f59e0b" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.map(goal => {
          const pct = Math.min(100, Math.round(goal.current / goal.target * 100));
          const col = statusColors[goal.status] || '#00e5ff';
          return (
            <Card key={goal.id} style={{ borderLeft: `3px solid ${col}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, color: '#e2e8f0' }}>{goal.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge type={goal.status === 'completed' ? 'green' : 'blue'}>{goal.status === 'completed' ? '✅ Completed' : '⏳ In Progress'}</Badge>
                    {goal.deadline && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>📅 {goal.deadline}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleComplete(goal.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 11, fontWeight: 700 }}>{goal.status === 'completed' ? '↩ Reopen' : '✓ Done'}</button>
                  <button onClick={() => deleteGoal(goal.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--mono)' }}>Progress: {goal.current} / {goal.target}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: 'var(--mono)' }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </Card>
          );
        })}
        {!goals.length && <EmptyState icon="🎯" title="No goals yet" sub="Add your first career goal to start tracking" />}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Career Goal" width={460}>
        {[['GOAL TITLE', 'title', 'text', 'e.g. Reach 85+ Resume Score'], ['TARGET VALUE', 'target', 'number', '100'], ['CURRENT VALUE', 'current', 'number', '0'], ['DEADLINE', 'deadline', 'date', '']].map(([label, key, type, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
          </div>
        ))}
        <button onClick={addGoal} style={{ width: '100%', padding: '11px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13 }}>Add Goal</button>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 8 — RESUME TIPS & LEARNING
// ─────────────────────────────────────────────────────────────
function TipsModule() {
  const [activeCategory, setActiveCategory] = useState('all');
  const tips = [
    { id: 1, category: 'ATS', title: 'Use Standard Section Headings', content: 'Avoid creative headings. ATS systems look for "Work Experience", "Education", "Skills". Creative headings like "My Journey" get ignored.', icon: '🤖', difficulty: 'easy' },
    { id: 2, category: 'Format', title: 'One Page for < 10 Years Experience', content: 'Unless you have 10+ years of highly relevant experience, keep your resume to one page. Recruiters spend 6-7 seconds on first review.', icon: '📄', difficulty: 'easy' },
    { id: 3, category: 'Impact', title: 'Quantify Every Achievement', content: 'Replace "improved sales" with "increased sales by 34% in Q3 2023". Numbers create instant credibility and make accomplishments tangible.', icon: '📊', difficulty: 'medium' },
    { id: 4, category: 'Keywords', title: 'Mirror Job Description Language', content: 'Copy exact keywords from the job posting. If the JD says "cross-functional collaboration" use that phrase, not "teamwork across departments".', icon: '🔑', difficulty: 'medium' },
    { id: 5, category: 'ATS', title: 'Avoid Tables and Text Boxes', content: 'Many ATS systems cannot parse text inside tables or text boxes. All critical info must be in the main body as plain text.', icon: '⚠️', difficulty: 'easy' },
    { id: 6, category: 'Impact', title: 'Lead with Strong Action Verbs', content: 'Start each bullet with powerful verbs: Architected, Spearheaded, Generated, Reduced, Accelerated. Avoid weak openers like "Responsible for" or "Worked on".', icon: '⚡', difficulty: 'easy' },
    { id: 7, category: 'Format', title: 'Use Consistent Date Format', content: 'Pick "Jan 2022 – Present" or "01/2022 – Present" and use it everywhere. Inconsistency signals lack of attention to detail.', icon: '📅', difficulty: 'easy' },
    { id: 8, category: 'Keywords', title: 'Include Soft Skills Subtly', content: 'Don\'t list "communication" as a skill. Instead prove it: "Presented quarterly roadmap to 200+ stakeholders across 3 business units."', icon: '💬', difficulty: 'hard' },
    { id: 9, category: 'ATS', title: 'Submit PDF for Human Review', content: 'Use PDF when emailing directly to a recruiter. Use Word/DOCX when submitting through an ATS portal — it parses better.', icon: '📨', difficulty: 'easy' },
  ];

  const categories = ['all', ...new Set(tips.map(t => t.category))];
  const filtered = activeCategory === 'all' ? tips : tips.filter(t => t.category === activeCategory);
  const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Resume Tips & Learning</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Expert tips to boost your resume score and get more interviews</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, background: activeCategory === cat ? 'rgba(0,229,255,0.12)' : 'var(--surface)', border: `1px solid ${activeCategory === cat ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`, color: activeCategory === cat ? 'var(--accent)' : 'var(--text2)', textTransform: 'capitalize' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {filtered.map(tip => (
          <Card key={tip.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22 }}>{tip.icon}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge type="blue">{tip.category}</Badge>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: diffColor[tip.difficulty], fontWeight: 700, border: `1px solid ${diffColor[tip.difficulty]}40`, borderRadius: 6, padding: '1px 6px' }}>{tip.difficulty}</span>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#e2e8f0', lineHeight: 1.3 }}>{tip.title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--mono)', lineHeight: 1.7 }}>{tip.content}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 9 — KEYWORD OPTIMIZER
// ─────────────────────────────────────────────────────────────
function KeywordOptimizerModule() {
  const [jd, setJd] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState(null);

  const analyze = () => {
    if (!jd.trim() || !resumeText.trim()) return;
    const jdWords = jd.toLowerCase().match(/\b[a-z][a-z0-9+#.-]{2,}\b/g) || [];
    const resumeWords = resumeText.toLowerCase().match(/\b[a-z][a-z0-9+#.-]{2,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'let', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'did', 'she', 'too', 'use', 'with', 'from', 'this', 'that', 'will', 'have', 'they', 'been', 'when', 'more', 'work', 'also', 'into', 'some', 'than', 'then', 'them', 'well', 'were']);
    const jdFreq = {};
    jdWords.filter(w => !stopWords.has(w) && w.length > 3).forEach(w => { jdFreq[w] = (jdFreq[w] || 0) + 1; });
    const resumeSet = new Set(resumeWords);
    const sorted = Object.entries(jdFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);
    const found = sorted.filter(([w]) => resumeSet.has(w));
    const missing = sorted.filter(([w]) => !resumeSet.has(w));
    setResult({ found, missing, total: sorted.length, score: Math.round(found.length / sorted.length * 100) });
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Keyword Optimizer</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Paste your resume and a job description to instantly find missing keywords</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionHeader>Job Description</SectionHeader>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job description here…" rows={10} />
        </Card>
        <Card>
          <SectionHeader>Your Resume Text</SectionHeader>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text here (copy from your document)…" rows={10} />
        </Card>
      </div>

      <button onClick={analyze} disabled={!jd.trim() || !resumeText.trim()} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 800, fontSize: 14, background: (!jd.trim() || !resumeText.trim()) ? 'var(--surface)' : 'linear-gradient(90deg,#00e5ff,#818cf8)', color: (!jd.trim() || !resumeText.trim()) ? 'var(--muted)' : '#060910', border: (!jd.trim() || !resumeText.trim()) ? '1px solid var(--border)' : 'none', marginBottom: 24 }}>
        🔍 Analyze Keywords
      </button>

      {result && (
        <div style={{ animation: 'fadeUp 0.35s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            <MiniStat label="Keyword Match" value={`${result.score}%`} icon="🎯" color={result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'} />
            <MiniStat label="Keywords Found" value={result.found.length} icon="✅" color="#10b981" />
            <MiniStat label="Keywords Missing" value={result.missing.length} icon="❌" color="#ef4444" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <SectionHeader>Missing Keywords (Add These!)</SectionHeader>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {result.missing.map(([word, freq]) => (
                  <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 9px' }}>
                    <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'var(--mono)', fontWeight: 600 }}>{word}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>×{freq}</span>
                  </div>
                ))}
                {!result.missing.length && <div style={{ fontSize: 12, color: '#10b981', fontFamily: 'var(--mono)' }}>🎉 You have all top keywords!</div>}
              </div>
            </Card>
            <Card>
              <SectionHeader>Keywords Already Present</SectionHeader>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {result.found.map(([word, freq]) => (
                  <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '3px 9px' }}>
                    <span style={{ fontSize: 12, color: '#10b981', fontFamily: 'var(--mono)', fontWeight: 600 }}>✓ {word}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>×{freq}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 10 — RESUME CHECKLIST
// ─────────────────────────────────────────────────────────────
function ChecklistModule() {
  const sections = [
    {
      title: 'Contact Information', items: [
        { id: 'c1', text: 'Full name prominently displayed at top', done: false },
        { id: 'c2', text: 'Professional email address (no nicknames)', done: false },
        { id: 'c3', text: 'Phone number with country code if applying internationally', done: false },
        { id: 'c4', text: 'LinkedIn profile URL (custom, not default)', done: false },
        { id: 'c5', text: 'City and State (full address not needed)', done: false },
      ]
    },
    {
      title: 'Work Experience', items: [
        { id: 'w1', text: 'Listed in reverse chronological order', done: false },
        { id: 'w2', text: 'Each role has 3-6 quantified bullet points', done: false },
        { id: 'w3', text: 'All bullets start with strong action verbs', done: false },
        { id: 'w4', text: 'Numbers and percentages included in achievements', done: false },
        { id: 'w5', text: 'Job titles and dates are clearly formatted', done: false },
      ]
    },
    {
      title: 'Skills & Keywords', items: [
        { id: 's1', text: 'Technical skills section present', done: false },
        { id: 's2', text: 'Keywords from target job descriptions included', done: false },
        { id: 's3', text: 'Soft skills demonstrated through examples (not listed)', done: false },
        { id: 's4', text: 'Certifications and licenses listed with expiry dates', done: false },
      ]
    },
    {
      title: 'Formatting & ATS', items: [
        { id: 'f1', text: 'Standard readable font (11-12pt)', done: false },
        { id: 'f2', text: 'Consistent margins (0.5-1 inch)', done: false },
        { id: 'f3', text: 'No tables, columns or text boxes', done: false },
        { id: 'f4', text: 'Saved as PDF (or DOCX for ATS submission)', done: false },
        { id: 'f5', text: 'Proofread for spelling and grammar errors', done: false },
      ]
    },
  ];

  const [items, setItems] = useState(sections.flatMap(s => s.items));
  const toggle = id => setItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  const totalDone = items.filter(i => i.done).length;
  const totalItems = items.length;
  const pct = Math.round(totalDone / totalItems * 100);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Resume Checklist</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Complete checklist for a job-ready resume</div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#e2e8f0' }}>Overall Completion</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', fontFamily: 'var(--mono)' }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{totalDone} of {totalItems} items completed</div>
      </Card>

      {sections.map(section => {
        const sectionItems = items.filter(item => section.items.some(si => si.id === item.id));
        const doneCnt = sectionItems.filter(i => i.done).length;
        return (
          <Card key={section.title} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionHeader>{section.title}</SectionHeader>
              <span style={{ fontSize: 11, color: doneCnt === sectionItems.length ? '#10b981' : 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{doneCnt}/{sectionItems.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sectionItems.map(item => (
                <div key={item.id} onClick={() => toggle(item.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, transition: 'background 0.15s', background: item.done ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                  onMouseEnter={e => { if (!item.done) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!item.done) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${item.done ? '#10b981' : 'var(--border)'}`, background: item.done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                    {item.done && <span style={{ fontSize: 11, color: '#060910', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? '#475569' : '#e2e8f0', textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.5, transition: 'color 0.2s' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE 11 — SCORE SIMULATOR
// ─────────────────────────────────────────────────────────────
function ScoreSimulatorModule() {
  const [scores, setScores] = useState({ overall: 62, ats: 58, readability: 65, impact: 55, format: 70, jobMatch: 60 });
  const [improvements, setImprovements] = useState({ quantifiedAchievements: false, keywordsAdded: false, actionVerbs: false, linkedinAdded: false, certifications: false, formatFixed: false });

  const bonuses = {
    quantifiedAchievements: { overall: 8, impact: 15, readability: 3 },
    keywordsAdded: { overall: 7, ats: 14, jobMatch: 18 },
    actionVerbs: { overall: 4, impact: 8, readability: 6 },
    linkedinAdded: { overall: 3, ats: 5, format: 4 },
    certifications: { overall: 5, ats: 8, jobMatch: 7 },
    formatFixed: { overall: 6, ats: 12, format: 15, readability: 5 },
  };

  const computeScores = () => {
    const base = { overall: 62, ats: 58, readability: 65, impact: 55, format: 70, jobMatch: 60 };
    Object.entries(improvements).forEach(([key, val]) => {
      if (val && bonuses[key]) {
        Object.entries(bonuses[key]).forEach(([metric, bonus]) => {
          base[metric] = Math.min(100, (base[metric] || 0) + bonus);
        });
      }
    });
    setScores(base);
  };

  useEffect(() => { computeScores(); }, [improvements]);

  const improvementLabels = {
    quantifiedAchievements: ['📊', 'Add quantified achievements (+15 Impact)', 'Turn "improved sales" into "increased sales by 34%"'],
    keywordsAdded: ['🔑', 'Mirror job description keywords (+14 ATS)', 'Copy exact phrases from the job posting'],
    actionVerbs: ['⚡', 'Use strong action verbs (+8 Impact)', 'Replace "Responsible for" with "Architected" or "Led"'],
    linkedinAdded: ['🔗', 'Add LinkedIn profile URL (+5 ATS)', 'Include your custom LinkedIn URL in contact info'],
    certifications: ['🏆', 'List certifications (+8 ATS)', 'Add AWS, Google, or relevant industry certifications'],
    formatFixed: ['🎨', 'Fix formatting issues (+12 ATS)', 'Remove tables, use standard headings, consistent spacing'],
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: '#e2e8f0' }}>Score Simulator</div>
      <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 24 }}>Simulate how specific improvements would boost your resume score</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <Card>
          <SectionHeader>Toggle Improvements</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(improvementLabels).map(([key, [icon, label, desc]]) => (
              <div key={key} onClick={() => setImprovements(p => ({ ...p, [key]: !p[key] }))} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${improvements[key] ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`, background: improvements[key] ? 'rgba(16,185,129,0.06)' : 'var(--surface)', transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${improvements[key] ? '#10b981' : 'var(--border)'}`, background: improvements[key] ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {improvements[key] && <span style={{ fontSize: 11, color: '#060910', fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: improvements[key] ? '#10b981' : '#e2e8f0', marginBottom: 2 }}>{icon} {label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader>Simulated Score Preview</SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <ScoreRing score={scores.overall} size={72} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Projected Overall Score</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(scores.overall), letterSpacing: '-0.02em' }}>{scores.overall}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span></div>
              <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'var(--mono)' }}>+{scores.overall - 62} from baseline</div>
            </div>
          </div>
          {[['ATS Score', scores.ats, 58], ['Readability', scores.readability, 65], ['Impact', scores.impact, 55], ['Format', scores.format, 70], ['Job Match', scores.jobMatch, 60]].map(([label, val, base]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', textDecoration: 'line-through' }}>{base}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(val), fontFamily: 'var(--mono)' }}>{val}</span>
                  {val > base && <span style={{ fontSize: 10, color: '#10b981', fontFamily: 'var(--mono)' }}>+{val - base}</span>}
                </div>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${val}%`, background: scoreColor(val), borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,229,255,0.05)', borderRadius: 8, border: '1px solid rgba(0,229,255,0.12)', fontSize: 11, color: '#94a3b8', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
            💡 These are simulated estimates based on common improvement patterns. Actual scores may vary.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE — 250 RESUME TEMPLATES
// ─────────────────────────────────────────────────────────────
// MODULE — TEMPLATES (uses TemplateGallery with 250 visual previews)
// ─────────────────────────────────────────────────────────────
function TemplatesModule() {
  const [selected, setSelected] = useState(null);
  const [aiFixOpen, setAiFixOpen] = useState(false);
  const [aiFile, setAiFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiMsg, setAiMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileRef = useRef();
  const toast = useToast();

  const handleAiFile = f => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) { toast.error('Only PDF, DOCX, TXT supported'); return; }
    setAiFile(f); setAiResult(null);
  };

  const runAiFix = async () => {
    if (!aiFile) { toast.error('Please upload your resume first'); return; }
    if (!selected) { toast.error('Please choose a template first'); return; }
    setAiLoading(true); setAiResult(null);
    const messages = [
      'Parsing your resume…',
      'Detecting structure issues…',
      'Matching to template style…',
      'Running AI professional rewrite…',
      'Generating section improvements…',
      'Optimising ATS keywords…',
      'Finalising professional suggestions…',
    ];
    let mi = 0; setAiMsg(messages[0]);
    const iv = setInterval(() => { mi = (mi + 1) % messages.length; setAiMsg(messages[mi]); }, 1800);
    try {
      const fd = new FormData();
      fd.append('resume', aiFile);
      fd.append('template_name', selected.name);
      fd.append('template_style', selected.subcategory || selected.category);
      fd.append('template_category', selected.category);
      fd.append('layout_index', selected.layoutIndex);
      const r = await axios.post('/api/user/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = r.data.data;
      setAiResult({ analysis: data, template: selected, professionalFixes: buildProfessionalFixes(data, selected) });
      toast.success('AI resume fix complete!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'AI fix failed. Please retry.');
    } finally { clearInterval(iv); setAiLoading(false); setAiMsg(''); }
  };

  const downloadFixedResumePDF = async () => {
    if (!aiResult) return;
    setPdfLoading(true);
    try {
      const aid = aiResult.analysis?.analysis_id;
      if (!aid) { toast.error('Analysis ID missing — please re-run AI fix'); setPdfLoading(false); return; }
      const r = await axios.get(
        `/api/user/analyses/${aid}/download-fixed`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fixed_Resume_${aiResult.template?.name || 'Professional'}_${Date.now()}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fixed resume PDF downloaded!');
    } catch (e) {
      toast.error('PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const buildProfessionalFixes = (data, template) => {
    const fixes = [];
    fixes.push({
      section: '📋 Header & Contact', priority: 'HIGH', color: '#ef4444',
      original: 'Generic header with basic contact info',
      improved: `Use a bold, ATS-optimised header matching the ${template.name} style. Include: Full Name, Professional Title ("${data.current_role || template.subcategory}"), Email | Phone | LinkedIn | City, State`,
      tip: 'Recruiters spend 6 seconds on headers. Make it count.',
    });
    fixes.push({
      section: '🎯 Professional Summary', priority: 'HIGH', color: '#ef4444',
      original: data.summary ? data.summary.slice(0, 80) + '…' : 'Missing or weak summary',
      improved: `Rewrite as a 3-line power summary: [Years] of experience in ${template.category} | Key achievement (quantified) | What you bring to the role. Avoid "I" and filler words.`,
      tip: 'A strong summary can boost your interview rate by 40%.',
    });
    const expScore = data.sections?.work_experience || 0;
    fixes.push({
      section: '💼 Work Experience', priority: expScore < 18 ? 'HIGH' : 'MEDIUM', color: expScore < 18 ? '#ef4444' : '#f59e0b',
      original: `Section score: ${expScore}/25 — bullets lack quantification`,
      improved: 'Rewrite each bullet using the CAR formula: Context → Action → Result. Add metrics: "Increased X by Y%." Use power verbs: Architected, Spearheaded, Optimised, Scaled, Delivered.',
      tip: 'Add at least 3 quantified achievements to boost impact score to 90+.',
    });
    const skillScore = data.sections?.skills || 0;
    fixes.push({
      section: '🛠 Skills Section', priority: skillScore < 15 ? 'HIGH' : 'MEDIUM', color: skillScore < 15 ? '#ef4444' : '#f59e0b',
      original: `Skills listed: ${(data.top_skills || []).join(', ') || 'Not detected'}`,
      improved: `Organise into: Technical Skills | Soft Skills | Tools. Add missing keywords from job description: ${(data.keywords_missing || []).slice(0, 5).join(', ') || 'N/A'}.`,
      tip: 'ATS systems parse skills sections first. Structured = better ranking.',
    });
    fixes.push({
      section: '🤖 ATS Compatibility', priority: (data.ats_score || 0) < 70 ? 'HIGH' : 'LOW', color: (data.ats_score || 0) < 70 ? '#ef4444' : '#10b981',
      original: `ATS Score: ${data.ats_score || 'N/A'}/100`,
      improved: `Apply the ${template.name} template's ${template.layout} layout — ATS score: ${template.atsScore}/100. Remove: tables, text boxes, images, non-standard fonts. Use standard section headers. Save as PDF.`,
      tip: '75% of resumes are rejected by ATS before a human sees them.',
    });
    fixes.push({
      section: '📐 Format & Layout', priority: 'MEDIUM', color: '#f59e0b',
      original: 'Inconsistent spacing, fonts, or margins detected',
      improved: `Adopt the ${template.name} layout: margins 0.75", font Inter or Calibri 10-11pt, section headers 12-13pt bold. Keep to 1 page (< 5 yrs) or 2 pages max. Use 1.15 line spacing.`,
      tip: 'Clean formatting signals professionalism before content is read.',
    });
    if (data.recommendations?.length) {
      data.recommendations.slice(0, 2).forEach(rec => {
        fixes.push({
          section: `💡 ${rec.category}`, priority: rec.priority?.toUpperCase() || 'MEDIUM',
          color: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981',
          original: 'AI-detected issue', improved: rec.text,
          tip: 'Prioritise this based on your target job description.',
        });
      });
    }
    return fixes;
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div />
        <button
          onClick={() => { if (!selected) { toast.error('Select a template first, then click AI Fix'); return; } setAiFixOpen(true); }}
          style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13, boxShadow: '0 0 24px rgba(0,229,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          ✨ AI Fix My Resume
          {selected && <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '2px 7px' }}>Template #{selected.id} selected</span>}
        </button>
      </div>

      {/* 250-template gallery with visual previews */}
      <TemplateGallery onSelect={setSelected} />

      {/* AI Fix Modal */}
      {aiFixOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,16,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setAiFixOpen(false); setAiResult(null); } }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0' }}>✨ AI Professional Resume Fix</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                  {selected ? `Template: ${selected.name} (ATS ${selected.atsScore}/100)` : '⚠ No template selected'}
                </div>
              </div>
              <button onClick={() => { setAiFixOpen(false); setAiResult(null); }} style={{ fontSize: 20, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {!aiResult ? (
              <>
                {/* Step 1: Template */}
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff', fontFamily: 'var(--mono)', marginBottom: 8 }}>STEP 1 — TEMPLATE SELECTED</div>
                  {selected ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: selected.bg, border: `2px solid ${selected.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{selected.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{selected.category} · {selected.level} · ATS {selected.atsScore}/100</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: 20 }}>✅</span>
                    </div>
                  ) : (
                    <div style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'var(--mono)' }}>⚠ Close this modal and click a template card first, then come back.</div>
                  )}
                </div>

                {/* Step 2: Upload */}
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff', fontFamily: 'var(--mono)', marginBottom: 10 }}>STEP 2 — UPLOAD YOUR CURRENT RESUME</div>
                  <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${aiFile ? '#10b981' : 'var(--border)'}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: aiFile ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleAiFile(e.target.files[0])} />
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{aiFile ? '✅' : '📤'}</div>
                    {aiFile ? (
                      <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>{aiFile.name} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>({(aiFile.size / 1024).toFixed(0)} KB)</span></div>
                    ) : (
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Click to upload resume (PDF, DOCX, TXT)</div>
                    )}
                  </div>
                </div>

                <button onClick={runAiFix} disabled={aiLoading || !aiFile || !selected}
                  style={{ width: '100%', padding: '14px', borderRadius: 11, fontWeight: 800, fontSize: 14,
                    background: aiLoading || !aiFile || !selected ? 'rgba(255,255,255,0.06)' : 'linear-gradient(90deg,#00e5ff,#818cf8)',
                    color: aiLoading || !aiFile || !selected ? 'var(--muted)' : '#060910',
                    border: aiLoading || !aiFile || !selected ? '1px solid var(--border)' : 'none',
                    cursor: aiLoading || !aiFile || !selected ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: !aiLoading && aiFile && selected ? '0 0 28px rgba(0,229,255,0.25)' : 'none',
                  }}>
                  {aiLoading ? (
                    <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#060910', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />{aiMsg}</>
                  ) : '✨ Run AI Professional Fix'}
                </button>
              </>
            ) : (
              <div>
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{aiResult.analysis.overall_score || '—'}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Current Resume Score</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{aiResult.analysis.candidate_name} · {aiResult.analysis.industry}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'var(--mono)', fontWeight: 700 }}>Template: {aiResult.template.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>ATS {aiResult.template.atsScore}/100</div>
                    </div>
                  </div>
                </div>

                {/* Fix cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {aiResult.professionalFixes.map((fix, i) => (
                    <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${fix.color}33`, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${fix.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>{fix.section}</span>
                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: `${fix.color}20`, color: fix.color, fontWeight: 800, fontFamily: 'var(--mono)' }}>{fix.priority}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '10px' }}>
                          <div style={{ fontSize: 9, color: '#ef4444', fontFamily: 'var(--mono)', marginBottom: 4, fontWeight: 700 }}>CURRENT</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{fix.original}</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '10px' }}>
                          <div style={{ fontSize: 9, color: '#10b981', fontFamily: 'var(--mono)', marginBottom: 4, fontWeight: 700 }}>AI IMPROVEMENT</div>
                          <div style={{ fontSize: 11, color: '#e2e8f0' }}>{fix.improved}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>💡</span><span style={{ fontStyle: 'italic' }}>{fix.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setAiResult(null); setAiFile(null); }} style={{ padding: '10px 16px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Fix Another</button>
                  <button
                    onClick={downloadFixedResumePDF}
                    disabled={pdfLoading}
                    style={{ flex: 1, padding: '10px', borderRadius: 9,
                      background: pdfLoading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(90deg,#10b981,#059669)',
                      color: pdfLoading ? 'var(--muted)' : '#fff',
                      fontWeight: 800, fontSize: 13, border: 'none', cursor: pdfLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: pdfLoading ? 'none' : '0 0 20px rgba(16,185,129,0.3)' }}>
                    {pdfLoading
                      ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.65s linear infinite'}} />Generating…</>
                      : <>⬇ Download Fixed Resume PDF</>}
                  </button>
                  <button onClick={() => { setAiFixOpen(false); setAiResult(null); }} style={{ padding: '10px 16px', borderRadius: 9, background: 'linear-gradient(90deg,#00e5ff,#818cf8)', color: '#060910', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}>✓ Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULE — AI ASSISTANT CHAT
// ─────────────────────────────────────────────────────────────
function AIAssistantModule() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your ResumeAI Assistant. Ask me anything about your resume, ATS optimization, job searching, or career advice. I\'m fast and to the point!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisCtx, setAnalysisCtx] = useState(null);
  const bottomRef = useRef();
  const toast = useToast();

  // Load most recent analysis for context
  useEffect(() => {
    axios.get('/api/user/analyses?per_page=1').then(r => {
      const items = r.data?.items || [];
      if (items.length > 0) {
        axios.get(`/api/user/analyses/${items[0].id}`).then(r2 => {
          const d = r2.data || {};
          // Merge top-level fields + nested result for full context
          const ctx = {
            ...(d.result || {}),
            overall_score: d.overall_score ?? d.result?.overall_score,
            ats_score: d.ats_score ?? d.result?.ats_score,
            candidate_name: d.candidate_name ?? d.result?.candidate_name,
            current_role: d.current_role ?? d.result?.current_role,
            filename: d.filename,
          };
          setAnalysisCtx(ctx);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await axios.post('/api/user/assistant', {
        message: msg,
        history: history.slice(0, -1),
        analysis_context: analysisCtx || {},
      });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.reply }]);
    } catch (e) {
      const errMsg = e.response?.data?.error || 'AI unavailable. Make sure Ollama is running with llama3.2:3b.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'How do I improve my ATS score?',
    'What keywords should I add?',
    'How long should my resume be?',
    'Write a strong summary for me',
    'What are the top mistakes in my resume?',
    'How do I quantify achievements?',
    'Write a cover letter for me',
    'Common interview questions',
    'Career growth tips',
    'Salary negotiation advice',
    'Optimize my LinkedIn profile',
    'Project ideas for my skills',
    'How to handle employment gaps?',
    'List high-demand soft skills',
    'Mock interview: Behavioral',
    'Remote job search strategy',
    'Certifications worth getting',
    'Networking on LinkedIn tips',
    'How to list freelance work?',
    'Action verbs for experience',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>
          🤖 AI Resume Assistant
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          Powered by Ollama llama3.2:3b — Fast, local, private
          {analysisCtx && <span style={{ color: '#10b981', marginLeft: 10 }}>✓ Resume context loaded</span>}
        </div>
      </div>

      {/* Quick questions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {quickQuestions.map((q, i) => (
          <button key={i} onClick={() => { setInput(q); }}
            style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(0,229,255,0.07)',
              border: '1px solid rgba(0,229,255,0.18)', color: '#94a3b8', fontSize: 11,
              cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.borderColor='#00e5ff'; e.target.style.color='#00e5ff'; }}
            onMouseLeave={e => { e.target.style.borderColor='rgba(0,229,255,0.18)'; e.target.style.color='#94a3b8'; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 16,
        padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: m.role === 'user'
                ? 'linear-gradient(135deg,#818cf8,#6d28d9)'
                : 'linear-gradient(135deg,#00e5ff,#0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff' }}>
              {m.role === 'user' ? '👤' : '🤖'}
            </div>
            {/* Bubble */}
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg,rgba(129,140,248,0.18),rgba(109,40,217,0.12))'
                : 'var(--surface)',
              border: `1px solid ${m.role === 'user' ? 'rgba(129,140,248,0.25)' : 'var(--border)'}`,
              fontSize: 13, color: '#e2e8f0', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#00e5ff,#0891b2)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>🤖</div>
            <div style={{ padding:'12px 16px', borderRadius:'4px 16px 16px 16px',
              background:'var(--surface)', border:'1px solid var(--border)', display:'flex', gap:5, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#00e5ff',
                  animation:`bounce 1s ease ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your resume, ATS, keywords, career advice…"
          disabled={loading}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12,
            background: 'var(--card)', border: '1px solid var(--border)',
            color: '#e2e8f0', fontSize: 13, outline: 'none',
            opacity: loading ? 0.6 : 1 }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ padding: '12px 22px', borderRadius: 12, fontWeight: 800, fontSize: 14,
            background: loading || !input.trim()
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(90deg,#00e5ff,#818cf8)',
            color: loading || !input.trim() ? 'var(--muted)' : '#060910',
            border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: !loading && input.trim() ? '0 0 20px rgba(0,229,255,0.2)' : 'none' }}>
          {loading ? <Spinner size={16} /> : '➤'}
        </button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1.2)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN USER DASHBOARD
// ─────────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'MAIN', items: [
      { key: 'analyze',   icon: '⚡', label: 'Analyze Resume' },
      { key: 'assistant', icon: '🤖', label: 'AI Assistant' },
      { key: 'templates', icon: '🎨', label: 'Templates (250)' },
      { key: 'history',   icon: '📋', label: 'My Analyses' },
      { key: 'compare',   icon: '⚖️', label: 'Compare' },
    ]
  },
  {
    label: 'TOOLS', items: [
      { key: 'keywords', icon: '🔑', label: 'Keyword Optimizer' },
      { key: 'simulator', icon: '🎮', label: 'Score Simulator' },
      { key: 'checklist', icon: '✅', label: 'Resume Checklist' },
    ]
  },
  {
    label: 'GROWTH', items: [
      { key: 'goals', icon: '🎯', label: 'Career Goals' },
      { key: 'tips', icon: '💡', label: 'Resume Tips' },
      { key: 'skills', icon: '📚', label: 'Skills Library' },
    ]
  },
  {
    label: 'ACCOUNT', items: [
      { key: 'announcements', icon: '📢', label: 'Announcements' },
      { key: 'profile', icon: '👤', label: 'Profile & Settings' },
    ]
  },
];

export default function UserDashboard() {
  const [active, setActive] = useState('analyze');
  const [refreshKey, setRefreshKey] = useState(0);

  const renderModule = () => {
    switch (active) {
      case 'analyze':    return <AnalyzeModule onAnalysisDone={() => setRefreshKey(k => k + 1)} />;
      case 'assistant':  return <AIAssistantModule />;
      case 'templates':  return <TemplatesModule />;
      case 'history': return <HistoryModule key={refreshKey} />;
      case 'compare': return <CompareModule />;
      case 'keywords': return <KeywordOptimizerModule />;
      case 'simulator': return <ScoreSimulatorModule />;
      case 'checklist': return <ChecklistModule />;
      case 'goals': return <CareerGoalsModule />;
      case 'tips': return <TipsModule />;
      case 'skills': return <SkillsModule />;
      case 'announcements': return <AnnouncementsModule />;
      case 'profile': return <ProfileModule />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar navItems={NAV} active={active} onNav={setActive} />
      <main style={{ marginLeft: 230, flex: 1, padding: '28px 32px', animation: 'fadeUp 0.35s ease', minHeight: '100vh' }}>
        {renderModule()}
      </main>
    </div>
  );
}
