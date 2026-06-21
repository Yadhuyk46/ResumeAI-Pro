import React from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const scoreColor = n => n >= 75 ? '#10b981' : n >= 50 ? '#f59e0b' : '#ef4444';

// ── Score Trend Line Chart ────────────────────────────────────
export function ScoreTrendChart({ data = [] }) {
  if (!data.length) return <div style={{ textAlign: 'center', color: '#334155', padding: 30, fontSize: 12, fontFamily: 'monospace' }}>No trend data yet</div>;
  const formatted = data.map((d, i) => ({
    name: `#${i + 1}`,
    Overall: d.overall_score,
    ATS: d.ats_score,
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
        <Line type="monotone" dataKey="Overall" stroke="#00e5ff" strokeWidth={2} dot={{ fill: '#00e5ff', r: 3 }} />
        <Line type="monotone" dataKey="ATS" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Section Radar Chart ───────────────────────────────────────
export function SectionRadarChart({ sections = {} }) {
  const data = [
    { subject: 'Contact',    A: (sections.contact_info   || 0) / 10 * 100 },
    { subject: 'Experience', A: (sections.work_experience || 0) / 25 * 100 },
    { subject: 'Education',  A: (sections.education       || 0) / 15 * 100 },
    { subject: 'Skills',     A: (sections.skills          || 0) / 20 * 100 },
    { subject: 'Projects',   A: (sections.projects        || 0) / 15 * 100 },
    { subject: 'Achievements',A: (sections.achievements   || 0) / 15 * 100 },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Score" dataKey="A" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} strokeWidth={2} />
        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── Compare Bar Chart ─────────────────────────────────────────
export function CompareBarChart({ analyses = [] }) {
  if (analyses.length < 2) return null;
  const metrics = ['overall_score', 'ats_score', 'readability_score', 'job_match_score'];
  const labels  = ['Overall', 'ATS', 'Readability', 'Job Match'];
  const data = metrics.map((m, i) => ({
    name: labels[i],
    A: analyses[0]?.overall_score !== undefined ? (analyses[0][m] || analyses[0]?.result?.[m] || 0) : 0,
    B: analyses[1]?.overall_score !== undefined ? (analyses[1][m] || analyses[1]?.result?.[m] || 0) : 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
        <Bar dataKey="A" fill="#00e5ff" radius={[4, 4, 0, 0]} name={analyses[0]?.filename || 'Resume A'} />
        <Bar dataKey="B" fill="#818cf8" radius={[4, 4, 0, 0]} name={analyses[1]?.filename || 'Resume B'} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Daily Bar Chart (admin) ───────────────────────────────────
export function DailyBarChart({ data = [] }) {
  if (!data.length) return <div style={{ textAlign: 'center', color: '#334155', padding: 30, fontSize: 12 }}>No data yet</div>;
  const formatted = data.map(d => ({ name: d.day?.slice(5) || d.day, count: d.count, avg: d.avg_score }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
        <Bar dataKey="count" fill="#00e5ff" radius={[4, 4, 0, 0]} name="Analyses" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Score Distribution Pie (admin) ────────────────────────────
export function ScoreDistPie({ data = {} }) {
  const chartData = [
    { name: 'Excellent (80+)', value: data.excellent || 0, color: '#10b981' },
    { name: 'Good (60–80)',    value: data.good      || 0, color: '#00e5ff' },
    { name: 'Average (40–60)',  value: data.average   || 0, color: '#f59e0b' },
    { name: 'Poor (<40)',       value: data.poor      || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (!chartData.length) return <div style={{ textAlign: 'center', color: '#334155', padding: 30, fontSize: 12 }}>No data yet</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
          dataKey="value" paddingAngle={3}>
          {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
