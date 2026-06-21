import React, { useState, useMemo } from 'react';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';

/* ============================================================
   SAMPLE PERSONAS — 8 different people with different roles
   ============================================================ */
const PERSONAS = [
  {
    name:'ANDREW CLARK',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150',
    role:'Senior Software Engineer',    co1:'Google',         co2:'Amazon',       email:'andrew@email.com',    loc:'New York, NY',   skills:['React','TypeScript','Node.js','AWS','Docker','Python','PostgreSQL','Redis','Kubernetes','GraphQL'],    summary:'Results-driven engineer with 8+ years building scalable systems. Led teams of 12+, reducing infrastructure costs by 40% at Google.'
  },
  {
    name:'PRIYA SHARMA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=150&h=150',
    role:'Financial Analyst',           co1:'Goldman Sachs',  co2:'JP Morgan',    email:'priya@finance.com',   loc:'London, UK',     skills:['Financial Modeling','Excel','Bloomberg','VBA','SQL','PowerBI','Tableau','Risk Analysis','Python','FRM'], summary:'CFA-certified analyst with 6 years in investment banking. Managed $2B+ portfolio and delivered 18% above-benchmark returns.'
  },
  {
    name:'JAMES OKAFOR',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=150&h=150',
    role:'Product Manager',             co1:'Microsoft',      co2:'Uber',         email:'james@product.io',    loc:'San Francisco',  skills:['Product Strategy','Agile','Roadmapping','SQL','User Research','A/B Testing','Jira','Figma','OKRs','Go-to-Market'], summary:'Visionary PM with track record of launching 15+ products. Grew DAU from 200K to 2M at Microsoft through data-driven iterations.'
  },
  {
    name:'SOFIA MARTINEZ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=150&h=150',
    role:'UX/UI Designer',              co1:'Apple',          co2:'Figma',        email:'sofia@design.co',     loc:'Barcelona, ES',  skills:['Figma','Sketch','Prototyping','User Research','Design Systems','CSS','HTML','Motion','Accessibility','Branding'], summary:'Award-winning designer shaping human-centred experiences. Redesigned Apple Music onboarding reducing churn by 32%.'
  },
  {
    name:'LIAM CHEN',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=150&h=150',
    role:'Data Scientist',              co1:'Netflix',        co2:'Meta',         email:'liam@data.ai',        loc:'Seattle, WA',    skills:['Python','TensorFlow','PyTorch','SQL','Spark','Tableau','R','Statistics','NLP','LLMs'],                   summary:'ML researcher turned industry scientist. Built recommendation engine serving 220M Netflix users, increasing watch time 14%.'
  },
  {
    name:'AMARA OSEI',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?fit=crop&w=150&h=150',
    role:'Healthcare Consultant',       co1:'McKinsey',       co2:'WHO',          email:'amara@health.org',    loc:'Nairobi, KE',    skills:['Clinical Research','Data Analysis','Strategy','Excel','SPSS','Stakeholder Mgmt','Policy','Epidemiology','R','Tableau'], summary:'Public health expert bridging research and policy. Directed McKinsey health practice for Sub-Saharan Africa, impacting 5M+ lives.'
  },
  {
    name:'ETHAN BROOKS',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=150&h=150',
    role:'Marketing Director',          co1:'Nike',           co2:'Unilever',     email:'ethan@brand.co',      loc:'Chicago, IL',    skills:['Brand Strategy','Campaign Mgmt','SEO','Google Ads','Salesforce','HubSpot','Analytics','Copywriting','Social Media','CRM'], summary:'Creative strategist driving $50M+ in annual revenue. Launched Nike\'s fastest-growing digital campaign with 120M impressions.'
  },
  {
    name:'NINA PATEL',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?fit=crop&w=150&h=150',
    role:'Legal Counsel',               co1:'Clifford Chance','co2':'Linklaters', email:'nina@legal.law',      loc:'Dubai, UAE',     skills:['Contract Law','M&A','Due Diligence','Compliance','Corporate Law','Litigation','IP Law','Arbitration','GDPR','Negotiation'], summary:'Dual-qualified solicitor with 10 years M&A experience. Advised on 30+ cross-border transactions totalling $8B+.'
  },
];

const LANG_SETS = [
  [{l:'English',lv:'Native',d:5},{l:'Spanish',lv:'Advanced',d:4},{l:'French',lv:'Beginner',d:2}],
  [{l:'English',lv:'Fluent',d:5},{l:'Hindi',lv:'Native',d:5},{l:'Mandarin',lv:'Basic',d:1}],
  [{l:'English',lv:'Native',d:5},{l:'Yoruba',lv:'Native',d:5},{l:'French',lv:'Intermediate',d:3}],
  [{l:'English',lv:'Fluent',d:5},{l:'Spanish',lv:'Native',d:5},{l:'Catalan',lv:'Fluent',d:4}],
  [{l:'English',lv:'Native',d:5},{l:'Mandarin',lv:'Native',d:5},{l:'Japanese',lv:'Basic',d:2}],
  [{l:'English',lv:'Fluent',d:5},{l:'Swahili',lv:'Native',d:5},{l:'French',lv:'Advanced',d:4}],
  [{l:'English',lv:'Native',d:5},{l:'German',lv:'Advanced',d:4},{l:'Italian',lv:'Beginner',d:2}],
  [{l:'English',lv:'Fluent',d:5},{l:'Hindi',lv:'Native',d:5},{l:'Arabic',lv:'Advanced',d:4}],
];

/* ============================================================
   COLOUR UTILITY
   ============================================================ */
const isLight = bg => {
  const h = (bg||'#000').replace('#','');
  if (h.length < 6) return false;
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return (r*299+g*587+b*114)/1000 > 145;
};

/* ============================================================
   10 COMPLETELY DIFFERENT LAYOUT RENDERERS
   ============================================================ */

/* ── LAYOUT 0 · Classic Single Column, left-ruled sections ── */
function Layout0({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#111827':'#f1f5f9', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,padding:'20px 24px',fontFamily:'Georgia,serif',minHeight:500}}>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:26,fontWeight:900,color:tc,letterSpacing:'-0.02em',lineHeight:1.1}}>{p.name}</div>
        <div style={{fontSize:10,fontWeight:600,color:acc,margin:'3px 0 6px',fontFamily:'Arial,sans-serif'}}>{p.role}</div>
        <div style={{display:'flex',gap:12,fontSize:8,color:mc,fontFamily:'Arial,sans-serif',flexWrap:'wrap'}}>
          <span>✉ {p.email}</span><span>☏ +1-541-754-3010</span><span>📍 {p.loc}</span>
        </div>
      </div>
      <div style={{height:2,background:acc,marginBottom:10,borderRadius:1}}/>
      {/* Summary */}
      <div style={{borderLeft:`3px solid ${acc}`,paddingLeft:10,marginBottom:10}}>
        <div style={{fontSize:9,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4,fontFamily:'Arial,sans-serif'}}>Summary</div>
        <div style={{fontSize:8.5,color:bc,lineHeight:1.6,fontFamily:'Arial,sans-serif'}}>{p.summary}</div>
      </div>
      {/* Experience */}
      <div style={{borderLeft:`3px solid ${acc}`,paddingLeft:10,marginBottom:10}}>
        <div style={{fontSize:9,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6,fontFamily:'Arial,sans-serif'}}>Experience</div>
        {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'}].map((j,i)=>(
          <div key={i} style={{marginBottom:7}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:9.5,fontWeight:800,color:tc,fontFamily:'Arial,sans-serif'}}>{j.r}</span>
              <span style={{fontSize:8,color:mc,fontFamily:'Arial,sans-serif'}}>{j.yr}</span>
            </div>
            <div style={{fontSize:9,fontWeight:700,color:acc,fontFamily:'Arial,sans-serif',marginBottom:3}}>{j.c}</div>
            <div style={{fontSize:8,color:bc,fontFamily:'Arial,sans-serif',lineHeight:1.5}}>• Led cross-functional teams delivering measurable business impact<br/>• Reduced operational costs by 35% through process optimisation</div>
          </div>
        ))}
      </div>
      {/* Skills */}
      <div style={{borderLeft:`3px solid ${acc}`,paddingLeft:10}}>
        <div style={{fontSize:9,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5,fontFamily:'Arial,sans-serif'}}>Skills</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {p.skills.slice(0,8).map(s=>(
            <span key={s} style={{fontSize:7.5,padding:'2px 7px',borderRadius:3,background:`${acc}20`,border:`1px solid ${acc}40`,color:acc,fontFamily:'Arial,sans-serif',fontWeight:700}}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 1 · Bold Header Banner + Two-column body ── */
function Layout1({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#111827':'#f1f5f9', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,fontFamily:'Arial,sans-serif',minHeight:500}}>
      {/* Full-width banner header */}
      <div style={{background:acc,padding:'16px 20px',marginBottom:0}}>
        <div style={{fontSize:22,fontWeight:900,color:'#060910',letterSpacing:'-0.01em',fontFamily:'Impact,Arial,sans-serif'}}>{p.name}</div>
        <div style={{fontSize:10,fontWeight:700,color:'rgba(0,0,0,0.7)',marginTop:2}}>{p.role}</div>
        <div style={{display:'flex',gap:14,fontSize:8,color:'rgba(0,0,0,0.6)',marginTop:5,flexWrap:'wrap'}}>
          <span>✉ {p.email}</span><span>📍 {p.loc}</span><span>🔗 linkedin.com/in/{p.name.split(' ')[0].toLowerCase()}</span>
        </div>
      </div>
      {/* Two-column body */}
      <div style={{display:'grid',gridTemplateColumns:'40% 60%',minHeight:400}}>
        {/* Left */}
        <div style={{background:lt?`${acc}10`:`${acc}20`,padding:'14px 12px',borderRight:`1px solid ${acc}30`}}>
          <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>Core Skills</div>
          {p.skills.slice(0,7).map(s=>(
            <div key={s} style={{marginBottom:5}}>
              <div style={{fontSize:8,color:tc,marginBottom:2,fontWeight:600}}>{s}</div>
              <div style={{height:3,background:lt?'#e5e7eb':'rgba(255,255,255,0.15)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${60+(s.length*5)%35}%`,background:acc,borderRadius:2}}/>
              </div>
            </div>
          ))}
          <div style={{height:1,background:`${acc}30`,margin:'10px 0'}}/>
          <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>Languages</div>
          {lc.map(l=>(
            <div key={l.l} style={{marginBottom:6}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontSize:8,fontWeight:700,color:tc}}>{l.l}</span>
                <span style={{fontSize:7,color:mc}}>{l.lv}</span>
              </div>
              <div style={{display:'flex',gap:2}}>
                {[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:i<l.d?acc:(lt?'#e5e7eb':'rgba(255,255,255,0.15)')}}/>)}
              </div>
            </div>
          ))}
        </div>
        {/* Right */}
        <div style={{padding:'14px 14px'}}>
          <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>Experience</div>
          {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Startup Co.',yr:'2015–2017'}].map((j,i)=>(
            <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<2?`1px dashed ${acc}25`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:9.5,fontWeight:800,color:tc}}>{j.r}</span>
                <span style={{fontSize:7.5,color:mc}}>{j.yr}</span>
              </div>
              <span style={{fontSize:9,fontWeight:700,color:acc}}>{j.c}</span>
              <div style={{fontSize:8,color:bc,lineHeight:1.5,marginTop:2}}>• Delivered key results across multiple high-impact initiatives<br/>• Collaborated with senior stakeholders to drive strategic outcomes</div>
            </div>
          ))}
          <div style={{height:1,background:`${acc}30`,margin:'8px 0'}}/>
          <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:5}}>Education</div>
          <div style={{fontSize:9,fontWeight:800,color:tc}}>B.S. / Master's Degree</div>
          <div style={{fontSize:8.5,fontWeight:700,color:acc}}>Top University · 2011–2015</div>
          <div style={{fontSize:8,color:mc,marginTop:1}}>3.9 GPA · Dean's List</div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 2 · Dark sidebar LEFT, clean right ── */
function Layout2({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const sidebarBg = lt ? '#1e293b' : `${acc}22`;
  const tc = lt?'#111827':'#f1f5f9', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{display:'grid',gridTemplateColumns:'35% 65%',minHeight:500,background:bg,fontFamily:'Arial,sans-serif'}}>
      {/* Dark sidebar */}
      <div style={{background:sidebarBg,padding:'20px 14px'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:`${acc}33`,border:`3px solid ${acc}`,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:acc}}>
          {p.name.split(' ').map(n=>n[0]).join('')}
        </div>
        <div style={{textAlign:'center',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:900,color:'#f1f5f9',lineHeight:1.2,marginBottom:3}}>{p.name}</div>
          <div style={{fontSize:8.5,color:acc,fontWeight:700}}>{p.role}</div>
        </div>
        <div style={{height:1,background:`${acc}40`,marginBottom:10}}/>
        <div style={{fontSize:7.5,color:'rgba(255,255,255,0.55)',lineHeight:2,marginBottom:8}}>
          <div>✉ {p.email}</div><div>📍 {p.loc}</div><div>🔗 linkedin.com/in/profile</div>
        </div>
        <div style={{height:1,background:`${acc}30`,marginBottom:8}}/>
        <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Skills</div>
        {p.skills.slice(0,7).map(s=>(
          <div key={s} style={{fontSize:7.5,color:'rgba(255,255,255,0.75)',padding:'2px 0',fontWeight:600,borderBottom:'1px solid rgba(255,255,255,0.06)',marginBottom:3}}>▸ {s}</div>
        ))}
        <div style={{height:1,background:`${acc}30`,margin:'8px 0'}}/>
        <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Languages</div>
        {lc.map(l=>(
          <div key={l.l} style={{marginBottom:5}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
              <span style={{fontSize:7.5,fontWeight:700,color:'rgba(255,255,255,0.75)'}}>{l.l}</span>
              <span style={{fontSize:7,color:'rgba(255,255,255,0.4)'}}>{l.lv}</span>
            </div>
            <div style={{display:'flex',gap:2}}>
              {[0,1,2,3,4].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:i<l.d?acc:'rgba(255,255,255,0.12)'}}/>)}
            </div>
          </div>
        ))}
      </div>
      {/* Main right */}
      <div style={{padding:'20px 16px',background:bg}}>
        <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:4}}>Profile</div>
        <div style={{height:2,background:acc,marginBottom:8,borderRadius:1}}/>
        <div style={{fontSize:8.5,color:bc,lineHeight:1.65,marginBottom:10}}>{p.summary}</div>
        <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:4}}>Experience</div>
        <div style={{height:2,background:acc,marginBottom:8,borderRadius:1}}/>
        {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Startup Co.',yr:'2015–2017'}].map((j,i)=>(
          <div key={i} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:10,fontWeight:800,color:tc}}>{j.r}</span>
              <span style={{fontSize:8,color:mc}}>{j.yr}</span>
            </div>
            <div style={{fontSize:9,fontWeight:700,color:acc,marginBottom:2}}>{j.c}</div>
            <div style={{fontSize:8,color:bc,lineHeight:1.5}}>• Achieved 35%+ efficiency improvement via targeted initiatives<br/>• Managed cross-functional stakeholders across global teams</div>
          </div>
        ))}
        <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.12em',margin:'10px 0 4px'}}>Education</div>
        <div style={{height:2,background:acc,marginBottom:6,borderRadius:1}}/>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div><div style={{fontSize:9.5,fontWeight:800,color:tc}}>Master's Degree</div><div style={{fontSize:9,fontWeight:700,color:acc}}>Top University</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:8,color:mc}}>2013–2015</div><div style={{fontSize:8,color:acc}}>3.9 GPA</div></div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 3 · Minimalist, right sidebar, lots of whitespace ── */
function Layout3({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#1e293b':'rgba(255,255,255,0.75)', mc = lt?'#64748b':'rgba(255,255,255,0.4)';
  return (
    <div style={{display:'grid',gridTemplateColumns:'60% 40%',minHeight:500,background:bg,fontFamily:'"Helvetica Neue",Arial,sans-serif'}}>
      <div style={{padding:'22px 20px',borderRight:`1px solid ${lt?'#e2e8f0':`${acc}25`}`}}>
        <div style={{fontSize:24,fontWeight:300,color:tc,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:2}}>{p.name}</div>
        <div style={{width:40,height:3,background:acc,marginBottom:6,borderRadius:2}}/>
        <div style={{fontSize:9.5,fontWeight:600,color:acc,letterSpacing:'0.05em',marginBottom:10}}>{p.role}</div>
        <div style={{fontSize:8,color:mc,lineHeight:1.8,marginBottom:12,fontWeight:300}}>
          <div>{p.email}  ·  {p.loc}</div>
        </div>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>About Me</div>
        <div style={{width:20,height:2,background:acc,marginBottom:6}}/>
        <div style={{fontSize:8.5,color:bc,lineHeight:1.7,marginBottom:12,fontWeight:300}}>{p.summary}</div>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Experience</div>
        <div style={{width:20,height:2,background:acc,marginBottom:8}}/>
        {[{r:'Senior Position',c:p.co1,yr:'2020–2024'},{r:'Mid-Level Role',c:p.co2,yr:'2017–2020'},{r:'Junior Position',c:'Startup Co.',yr:'2015–2017'}].map((j,i)=>(
          <div key={i} style={{marginBottom:9,display:'flex',gap:10}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:acc,marginTop:3,flexShrink:0}}/>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:tc}}>{j.r}</div>
              <div style={{fontSize:9,color:acc,fontWeight:600,marginBottom:2}}>{j.c}  <span style={{color:mc,fontWeight:300}}>· {j.yr}</span></div>
              <div style={{fontSize:8,color:bc,lineHeight:1.55}}>Led initiatives driving significant operational improvements and revenue growth across key business units.</div>
            </div>
          </div>
        ))}
      </div>
      {/* Right side */}
      <div style={{padding:'22px 16px',background:lt?`${acc}08`:`${acc}15`}}>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Skills</div>
        <div style={{width:20,height:2,background:acc,marginBottom:8}}/>
        {p.skills.slice(0,8).map(s=>(
          <div key={s} style={{marginBottom:6}}>
            <div style={{fontSize:8.5,color:bc,marginBottom:2,fontWeight:300}}>{s}</div>
            <div style={{height:3,background:lt?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.1)',borderRadius:2}}>
              <div style={{height:'100%',width:`${58+(s.charCodeAt(0)%3)*12}%`,background:`linear-gradient(90deg,${acc},${acc}80)`,borderRadius:2}}/>
            </div>
          </div>
        ))}
        <div style={{height:1,background:lt?'#e2e8f0':`${acc}25`,margin:'12px 0'}}/>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Education</div>
        <div style={{fontSize:9,fontWeight:600,color:tc}}>Bachelor's / Master's</div>
        <div style={{fontSize:8.5,color:acc,marginBottom:1}}>Top University</div>
        <div style={{fontSize:8,color:mc}}>2011–2015 · 3.9 GPA</div>
        <div style={{height:1,background:lt?'#e2e8f0':`${acc}25`,margin:'12px 0'}}/>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Languages</div>
        {lc.map(l=>(
          <div key={l.l} style={{marginBottom:7}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:8.5,fontWeight:300,color:bc}}>{l.l}</span>
              <span style={{fontSize:7.5,color:mc}}>{l.lv}</span>
            </div>
            <div style={{display:'flex',gap:3}}>
              {[0,1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<l.d?acc:(lt?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.1)')}}/>)}
            </div>
          </div>
        ))}
        <div style={{height:1,background:lt?'#e2e8f0':`${acc}25`,margin:'12px 0'}}/>
        <div style={{fontSize:9,fontWeight:700,color:tc,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Strengths</div>
        {['Creative Thinker','Strategic Leader','Detail-Oriented'].map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
            <div style={{width:16,height:16,borderRadius:4,background:`${acc}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:acc}}>✦</div>
            <span style={{fontSize:8,color:bc,fontWeight:300}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── LAYOUT 4 · Executive — Centered header, horizontal dividers ── */
function Layout4({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,padding:'20px 24px',fontFamily:'Georgia,serif',minHeight:500}}>
      {/* Centered header */}
      <div style={{textAlign:'center',marginBottom:12}}>
        <div style={{fontSize:26,fontWeight:400,color:tc,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:3,fontFamily:'"Times New Roman",Georgia,serif'}}>{p.name}</div>
        <div style={{fontSize:10,color:acc,letterSpacing:'0.12em',fontFamily:'Arial,sans-serif',marginBottom:6}}>{p.role.toUpperCase()}</div>
        <div style={{display:'flex',justifyContent:'center',gap:16,fontSize:8,color:mc,fontFamily:'Arial,sans-serif'}}>
          <span>{p.email}</span><span>|</span><span>{p.loc}</span><span>|</span><span>linkedin.com/in/profile</span>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{flex:1,height:1,background:acc}}/><div style={{width:6,height:6,borderRadius:'50%',background:acc}}/><div style={{flex:1,height:1,background:acc}}/>
      </div>
      {/* Summary */}
      <div style={{textAlign:'center',fontSize:8.5,color:bc,lineHeight:1.7,marginBottom:12,fontStyle:'italic',fontFamily:'Georgia,serif',maxWidth:'80%',margin:'0 auto 12px'}}>{p.summary}</div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{flex:1,height:1,background:lt?'#e5e7eb':`${acc}30`}}/><span style={{fontSize:8,color:mc,fontFamily:'Arial,sans-serif',whiteSpace:'nowrap'}}>PROFESSIONAL EXPERIENCE</span><div style={{flex:1,height:1,background:lt?'#e5e7eb':`${acc}30`}}/>
      </div>
      {[{r:'Chief / Senior Executive',c:p.co1,yr:'2020–Present',loc:'New York'},{r:'Director / Lead',c:p.co2,yr:'2016–2020',loc:'London'}].map((j,i)=>(
        <div key={i} style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:1}}>
            <span style={{fontSize:11,fontWeight:700,color:tc,fontFamily:'"Times New Roman",Georgia,serif'}}>{j.r}</span>
            <span style={{fontSize:8,color:mc,fontFamily:'Arial,sans-serif',fontStyle:'italic'}}>{j.yr} · {j.loc}</span>
          </div>
          <div style={{fontSize:9,fontWeight:700,color:acc,letterSpacing:'0.05em',fontFamily:'Arial,sans-serif',marginBottom:4}}>{j.c}</div>
          <div style={{fontSize:8,color:bc,lineHeight:1.6,fontFamily:'Arial,sans-serif'}}>
            <div>• Directed organisational strategy, leading 200+ professionals across 8 global offices</div>
            <div>• Delivered 28% YoY revenue growth through disciplined execution and market expansion</div>
          </div>
        </div>
      ))}
      <div style={{display:'flex',alignItems:'center',gap:8,margin:'10px 0'}}>
        <div style={{flex:1,height:1,background:lt?'#e5e7eb':`${acc}30`}}/><span style={{fontSize:8,color:mc,fontFamily:'Arial,sans-serif',whiteSpace:'nowrap'}}>CORE COMPETENCIES</span><div style={{flex:1,height:1,background:lt?'#e5e7eb':`${acc}30`}}/>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
        {p.skills.slice(0,8).map(s=>(
          <span key={s} style={{fontSize:8,color:bc,fontFamily:'Arial,sans-serif',padding:'2px 0'}}>• {s}</span>
        ))}
      </div>
    </div>
  );
}

/* ── LAYOUT 5 · Modern card-based, gradient header ── */
function Layout5({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,fontFamily:'Arial,sans-serif',minHeight:500}}>
      {/* Gradient header */}
      <div style={{background:`linear-gradient(135deg,${acc},${acc}88)`,padding:'18px 20px 16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
        <div style={{position:'absolute',bottom:-30,right:40,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
        <div style={{fontSize:22,fontWeight:900,color:'#060910',letterSpacing:'-0.01em',lineHeight:1.1}}>{p.name}</div>
        <div style={{fontSize:10,fontWeight:700,color:'rgba(0,0,0,0.65)',margin:'3px 0 8px'}}>{p.role}</div>
        <div style={{display:'flex',gap:12,fontSize:8,color:'rgba(0,0,0,0.55)',flexWrap:'wrap'}}>
          <span>✉ {p.email}</span><span>📍 {p.loc}</span><span>🔗 linkedin.com</span>
        </div>
      </div>
      <div style={{padding:'14px 18px'}}>
        {/* Summary card */}
        <div style={{background:lt?`${acc}10`:`${acc}18`,border:`1px solid ${acc}30`,borderRadius:8,padding:'10px 12px',marginBottom:12}}>
          <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>About</div>
          <div style={{fontSize:8.5,color:bc,lineHeight:1.6}}>{p.summary}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'55% 45%',gap:12}}>
          {/* Left */}
          <div>
            <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Experience</div>
            {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Startup',yr:'2015–2017'}].map((j,i)=>(
              <div key={i} style={{background:lt?'rgba(0,0,0,0.03)':`${acc}08`,border:`1px solid ${acc}15`,borderRadius:6,padding:'7px 9px',marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:9,fontWeight:800,color:tc}}>{j.r}</span>
                  <span style={{fontSize:7.5,color:mc}}>{j.yr}</span>
                </div>
                <div style={{fontSize:8.5,fontWeight:700,color:acc,marginBottom:2}}>{j.c}</div>
                <div style={{fontSize:7.5,color:bc,lineHeight:1.5}}>Drove measurable results through strategic cross-functional leadership.</div>
              </div>
            ))}
          </div>
          {/* Right */}
          <div>
            <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Skills</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:10}}>
              {p.skills.slice(0,8).map(s=>(
                <span key={s} style={{fontSize:7.5,padding:'2px 6px',borderRadius:4,background:`${acc}20`,border:`1px solid ${acc}35`,color:acc,fontWeight:700}}>{s}</span>
              ))}
            </div>
            <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Languages</div>
            {lc.map(l=>(
              <div key={l.l} style={{marginBottom:5}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:8,fontWeight:700,color:tc}}>{l.l}</span>
                  <span style={{fontSize:7,color:mc}}>{l.lv}</span>
                </div>
                <div style={{display:'flex',gap:2}}>
                  {[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:i<l.d?acc:(lt?'#e5e7eb':'rgba(255,255,255,0.12)')}}/>)}
                </div>
              </div>
            ))}
            <div style={{height:1,background:`${acc}25`,margin:'8px 0'}}/>
            <div style={{fontSize:8,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Education</div>
            <div style={{background:lt?'rgba(0,0,0,0.03)':`${acc}08`,border:`1px solid ${acc}15`,borderRadius:6,padding:'7px 9px'}}>
              <div style={{fontSize:8.5,fontWeight:800,color:tc}}>Degree</div>
              <div style={{fontSize:8,fontWeight:700,color:acc}}>Top University</div>
              <div style={{fontSize:7.5,color:mc}}>2011–2015 · 3.9 GPA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 6 · Timeline-based experience, accent header stripe ── */
function Layout6({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,fontFamily:'Arial,sans-serif',minHeight:500}}>
      {/* Accent stripe header */}
      <div style={{borderLeft:`6px solid ${acc}`,padding:'16px 18px 14px',marginBottom:0,background:lt?`${acc}08`:`${acc}15`}}>
        <div style={{fontSize:24,fontWeight:900,color:tc,letterSpacing:'-0.01em'}}>{p.name}</div>
        <div style={{fontSize:10,color:acc,fontWeight:700,margin:'2px 0 6px'}}>{p.role}</div>
        <div style={{display:'flex',gap:12,fontSize:8,color:mc,flexWrap:'wrap'}}><span>✉ {p.email}</span><span>📍 {p.loc}</span></div>
      </div>
      <div style={{padding:'14px 18px'}}>
        <div style={{fontSize:8.5,color:bc,lineHeight:1.65,marginBottom:12,borderBottom:`1px solid ${lt?'#e5e7eb':`${acc}20`}`,paddingBottom:12}}>{p.summary}</div>
        <div style={{display:'grid',gridTemplateColumns:'58% 42%',gap:16}}>
          {/* Timeline left */}
          <div>
            <div style={{fontSize:8.5,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Career Timeline</div>
            {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid-Level Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Startup',yr:'2015–2017'},{r:'Intern',c:'Agency',yr:'2014–2015'}].map((j,i,arr)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:i<arr.length-1?0:0}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:i===0?acc:`${acc}60`,border:`2px solid ${acc}`,flexShrink:0}}/>
                  {i<arr.length-1&&<div style={{flex:1,width:2,background:`${acc}30`,margin:'2px 0',minHeight:28}}/>}
                </div>
                <div style={{paddingBottom:i<arr.length-1?12:0}}>
                  <div style={{fontSize:9,fontWeight:800,color:tc}}>{j.r}</div>
                  <div style={{fontSize:8.5,fontWeight:700,color:acc}}>{j.c} <span style={{color:mc,fontWeight:400}}>· {j.yr}</span></div>
                  {i<2&&<div style={{fontSize:8,color:bc,lineHeight:1.5,marginTop:2}}>Delivered strategic outcomes and measurable business value.</div>}
                </div>
              </div>
            ))}
          </div>
          {/* Right panel */}
          <div>
            <div style={{fontSize:8.5,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Core Skills</div>
            {p.skills.slice(0,7).map(s=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                <div style={{width:6,height:6,borderRadius:2,background:acc,flexShrink:0}}/>
                <span style={{fontSize:8,color:bc,flex:1}}>{s}</span>
                <div style={{width:40,height:3,background:lt?'#e5e7eb':'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${55+(s.length*6)%40}%`,background:acc,borderRadius:2}}/>
                </div>
              </div>
            ))}
            <div style={{height:1,background:lt?'#e5e7eb':`${acc}25`,margin:'10px 0'}}/>
            <div style={{fontSize:8.5,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Languages</div>
            {lc.map(l=>(
              <div key={l.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <span style={{fontSize:8,color:bc,fontWeight:600}}>{l.l}</span>
                <div style={{display:'flex',gap:2}}>
                  {[0,1,2,3,4].map(i=><div key={i} style={{width:6,height:6,borderRadius:1,background:i<l.d?acc:(lt?'#e5e7eb':'rgba(255,255,255,0.12)')}}/>)}
                </div>
              </div>
            ))}
            <div style={{height:1,background:lt?'#e5e7eb':`${acc}25`,margin:'10px 0'}}/>
            <div style={{fontSize:8.5,fontWeight:900,color:acc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Education</div>
            <div style={{borderLeft:`3px solid ${acc}`,paddingLeft:8}}>
              <div style={{fontSize:9,fontWeight:800,color:tc}}>Bachelor's / Master's</div>
              <div style={{fontSize:8.5,fontWeight:700,color:acc}}>Top University</div>
              <div style={{fontSize:8,color:mc}}>2011–2015 · 3.9 GPA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 7 · Creative, diagonal accent, icon skills ── */
function Layout7({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  const ICONS = ['⚡','🎯','💡','🔥','🚀','⭐','🛡️','🔑','📊','🎨','🌐','🧠'];
  return (
    <div style={{background:bg,fontFamily:'Arial,sans-serif',minHeight:500,position:'relative',overflow:'hidden'}}>
      {/* Diagonal accent block */}
      <div style={{position:'absolute',top:-30,right:-30,width:160,height:160,background:`${acc}15`,transform:'rotate(45deg)',borderRadius:20}}/>
      <div style={{position:'absolute',top:10,right:10,width:3,height:80,background:acc,borderRadius:2,opacity:0.5}}/>
      <div style={{padding:'20px 20px',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div>
            <div style={{fontSize:23,fontWeight:900,color:tc,letterSpacing:'-0.01em',lineHeight:1.1}}>{p.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
              <div style={{width:24,height:3,background:acc,borderRadius:2}}/>
              <div style={{fontSize:10,fontWeight:700,color:acc}}>{p.role}</div>
            </div>
          </div>
          <div style={{textAlign:'right',fontSize:8,color:mc,lineHeight:2}}>
            <div>{p.email}</div><div>{p.loc}</div>
          </div>
        </div>
        <div style={{fontSize:8.5,color:bc,lineHeight:1.65,borderTop:`2px dashed ${acc}40`,borderBottom:`2px dashed ${acc}40`,padding:'8px 0',margin:'8px 0'}}>{p.summary}</div>
        <div style={{display:'grid',gridTemplateColumns:'55% 45%',gap:14}}>
          {/* Experience */}
          <div>
            <div style={{fontSize:8.5,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:14,height:14,background:acc,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>🏢</div>
              Experience
            </div>
            {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Agency',yr:'2015–2017'}].map((j,i)=>(
              <div key={i} style={{marginBottom:8,paddingLeft:8,borderLeft:`2px solid ${i===0?acc:`${acc}40`}`}}>
                <div style={{fontSize:9,fontWeight:800,color:tc}}>{j.r}</div>
                <div style={{fontSize:8.5,color:acc,fontWeight:700,marginBottom:2}}>{j.c} · <span style={{color:mc,fontWeight:400}}>{j.yr}</span></div>
                <div style={{fontSize:7.5,color:bc,lineHeight:1.5}}>Delivered high-impact results through innovation and strategic leadership.</div>
              </div>
            ))}
          </div>
          {/* Skills with icons */}
          <div>
            <div style={{fontSize:8.5,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:14,height:14,background:acc,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>⚡</div>
              Skills
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:10}}>
              {p.skills.slice(0,8).map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 6px',borderRadius:5,background:`${acc}12`,border:`1px solid ${acc}25`}}>
                  <span style={{fontSize:9}}>{ICONS[i%ICONS.length]}</span>
                  <span style={{fontSize:7.5,color:bc,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{height:1,background:`${acc}25`,marginBottom:8}}/>
            <div style={{fontSize:8.5,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Languages</div>
            {lc.map(l=>(
              <div key={l.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <span style={{fontSize:8,color:bc,fontWeight:600}}>{l.l}</span>
                <div style={{display:'flex',gap:2}}>
                  {[0,1,2,3,4].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:i<l.d?acc:(lt?'#e5e7eb':'rgba(255,255,255,0.12)')}}/>)}
                </div>
              </div>
            ))}
            <div style={{height:1,background:`${acc}25`,margin:'8px 0'}}/>
            <div style={{fontSize:8,fontWeight:900,color:tc,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Education</div>
            <div style={{fontSize:8.5,fontWeight:800,color:tc}}>Degree · Top University</div>
            <div style={{fontSize:8,color:acc}}>2011–2015 · 3.9 GPA</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 8 · Infographic-style, colored section headers ── */
function Layout8({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  const SecH = ({children})=>(
    <div style={{display:'inline-block',background:acc,color:'#060910',fontSize:8,fontWeight:900,padding:'2px 10px',borderRadius:12,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em'}}>{children}</div>
  );
  return (
    <div style={{background:bg,fontFamily:'Arial,sans-serif',minHeight:500}}>
      {/* Header with photo circle placeholder */}
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'18px 20px',borderBottom:`3px solid ${acc}`,marginBottom:12}}>
        <div style={{width:60,height:60,borderRadius:'50%',background:`linear-gradient(135deg,${acc},${acc}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#060910',flexShrink:0,border:`3px solid ${acc}`}}>
          {p.name.split(' ').map(n=>n[0]).join('')}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:900,color:tc,letterSpacing:'-0.01em',lineHeight:1.1}}>{p.name}</div>
          <div style={{fontSize:10,fontWeight:700,color:acc,margin:'2px 0'}}>{p.role}</div>
          <div style={{display:'flex',gap:12,fontSize:8,color:mc,flexWrap:'wrap'}}><span>✉ {p.email}</span><span>📍 {p.loc}</span></div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:22,fontWeight:900,color:acc,lineHeight:1}}>97</div>
          <div style={{fontSize:7,color:mc,fontFamily:'monospace'}}>ATS SCORE</div>
          <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${acc}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'4px 0 0 auto'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:`${acc}30`}}/>
          </div>
        </div>
      </div>
      <div style={{padding:'0 20px 16px',display:'grid',gridTemplateColumns:'55% 45%',gap:16}}>
        <div>
          <SecH>Experience</SecH>
          {[{r:'Senior Role',c:p.co1,yr:'2020–2024'},{r:'Mid Role',c:p.co2,yr:'2017–2020'},{r:'Junior Role',c:'Startup',yr:'2015–2017'}].map((j,i)=>(
            <div key={i} style={{marginBottom:8,position:'relative',paddingLeft:10}}>
              <div style={{position:'absolute',left:0,top:4,width:4,height:4,borderRadius:'50%',background:acc}}/>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:9,fontWeight:800,color:tc}}>{j.r}</span><span style={{fontSize:7.5,color:mc}}>{j.yr}</span></div>
              <div style={{fontSize:8.5,fontWeight:700,color:acc,marginBottom:1}}>{j.c}</div>
              <div style={{fontSize:7.5,color:bc,lineHeight:1.5}}>Drove key initiatives with measurable business outcomes and team leadership.</div>
            </div>
          ))}
        </div>
        <div>
          <SecH>Skills</SecH>
          <div style={{marginBottom:10}}>
            {p.skills.slice(0,6).map(s=>(
              <div key={s} style={{marginBottom:5}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:1}}>
                  <span style={{fontSize:8,color:bc,fontWeight:600}}>{s}</span>
                  <span style={{fontSize:7,color:mc}}>{55+(s.length*5)%40}%</span>
                </div>
                <div style={{height:4,background:lt?'#e5e7eb':'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${55+(s.length*5)%40}%`,background:`linear-gradient(90deg,${acc},${acc}80)`,borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
          <SecH>Languages</SecH>
          {lc.map(l=>(
            <div key={l.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
              <span style={{fontSize:8,color:bc,fontWeight:600}}>{l.l} <span style={{color:mc,fontWeight:400,fontSize:7}}>· {l.lv}</span></span>
              <div style={{display:'flex',gap:2}}>
                {[0,1,2,3,4].map(i=><div key={i} style={{width:8,height:8,borderRadius:2,background:i<l.d?acc:(lt?'#e5e7eb':'rgba(255,255,255,0.12)')}}/>)}
              </div>
            </div>
          ))}
          <div style={{marginTop:8}}><SecH>Education</SecH></div>
          <div style={{background:`${acc}12`,border:`1px solid ${acc}30`,borderRadius:6,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:800,color:tc}}>Bachelor's / Master's</div>
            <div style={{fontSize:8.5,fontWeight:700,color:acc}}>Top University</div>
            <div style={{fontSize:8,color:mc}}>2011–2015 · 3.9 GPA</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 9 · Compact table-style, dense info ── */
function Layout9({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const tc = lt?'#0f172a':'#f8fafc', bc = lt?'#374151':'rgba(255,255,255,0.8)', mc = lt?'#6b7280':'rgba(255,255,255,0.45)';
  return (
    <div style={{background:bg,fontFamily:'"Courier New",monospace',minHeight:500}}>
      {/* Monospace-style header */}
      <div style={{background:acc,padding:'12px 18px'}}>
        <div style={{fontSize:20,fontWeight:900,color:'#060910',letterSpacing:'0.05em',fontFamily:'"Courier New",monospace'}}>{p.name}</div>
        <div style={{fontSize:9,color:'rgba(0,0,0,0.65)',marginTop:2,fontFamily:'"Courier New",monospace'}}>{p.role.toUpperCase()} // {p.loc}</div>
        <div style={{fontSize:8,color:'rgba(0,0,0,0.5)',marginTop:4,fontFamily:'"Courier New",monospace'}}>$ contact: {p.email}</div>
      </div>
      <div style={{padding:'14px 18px'}}>
        <div style={{background:lt?'rgba(0,0,0,0.03)':`${acc}08`,border:`1px solid ${acc}30`,borderRadius:4,padding:'8px 10px',marginBottom:10,fontFamily:'"Courier New",monospace',fontSize:8,color:bc,lineHeight:1.7}}>// {p.summary}</div>
        <div style={{display:'grid',gridTemplateColumns:'60% 40%',gap:14}}>
          <div>
            <div style={{fontSize:8,fontWeight:700,color:acc,fontFamily:'"Courier New",monospace',marginBottom:6}}>{'>'} EXPERIENCE</div>
            {[{r:'Senior Role',c:p.co1,yr:'2020–24'},{r:'Mid Role',c:p.co2,yr:'2017–20'},{r:'Junior Role',c:'Startup',yr:'2015–17'}].map((j,i)=>(
              <div key={i} style={{marginBottom:7,background:lt?'rgba(0,0,0,0.02)':`${acc}06`,border:`1px solid ${acc}20`,borderRadius:3,padding:'5px 8px'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:9,fontWeight:700,color:tc,fontFamily:'"Courier New",monospace'}}>[{j.r}]</span>
                  <span style={{fontSize:7.5,color:acc,fontFamily:'"Courier New",monospace'}}>{j.yr}</span>
                </div>
                <div style={{fontSize:8,color:acc,fontFamily:'"Courier New",monospace',marginBottom:2}}>@ {j.c}</div>
                <div style={{fontSize:7.5,color:bc,lineHeight:1.5,fontFamily:'"Courier New",monospace'}}>-- Led cross-team delivery with quantifiable results</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:8,fontWeight:700,color:acc,fontFamily:'"Courier New",monospace',marginBottom:6}}>{'>'} STACK</div>
            {p.skills.slice(0,8).map(s=>(
              <div key={s} style={{fontSize:7.5,color:bc,fontFamily:'"Courier New",monospace',padding:'2px 0',borderBottom:`1px solid ${acc}15`,marginBottom:2}}>
                <span style={{color:acc}}>+ </span>{s}
              </div>
            ))}
            <div style={{height:1,background:`${acc}25`,margin:'8px 0'}}/>
            <div style={{fontSize:8,fontWeight:700,color:acc,fontFamily:'"Courier New",monospace',marginBottom:5}}>{'>'} LANGUAGES</div>
            {lc.map(l=>(
              <div key={l.l} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:7.5,color:bc,fontFamily:'"Courier New",monospace'}}>{l.l}</span>
                <span style={{fontSize:7.5,color:acc,fontFamily:'"Courier New",monospace'}}>[{'■'.repeat(l.d)}{'□'.repeat(5-l.d)}]</span>
              </div>
            ))}
            <div style={{height:1,background:`${acc}25`,margin:'8px 0'}}/>
            <div style={{fontSize:8,fontWeight:700,color:acc,fontFamily:'"Courier New",monospace',marginBottom:5}}>{'>'} EDUCATION</div>
            <div style={{fontSize:8,color:tc,fontFamily:'"Courier New",monospace',lineHeight:1.6}}>
              <div>B.S./M.S. CompSci</div>
              <div style={{color:acc}}>@ Top University</div>
              <div style={{color:mc}}>2011–2015 // 3.9 GPA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 10 · "Ultimate Professional" — Based on Right Image ── */
function Layout10({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const mainBg = lt ? '#ffffff' : '#0f172a';
  const tc = lt ? '#111827' : '#f8fafc';
  const bc = lt ? '#374151' : 'rgba(255,255,255,0.8)';
  const mc = lt ? '#6b7280' : 'rgba(255,255,255,0.5)';
  const accentColor = acc || '#3b82f6';

  const SecTitle = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
      <div style={{ width: 14, height: 22, background: accentColor, marginRight: 10 }} />
      <div style={{ fontSize: 13, fontWeight: 900, color: tc, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ background: mainBg, minHeight: 500, fontFamily: 'Inter, system-ui, sans-serif', color: bc }}>
      {/* Header */}
      <div style={{ padding: '24px 30px', borderBottom: `1px solid ${lt ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}`, display: 'grid', gridTemplateColumns: '1fr 120px 1fr', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: tc, marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: accentColor }}>{p.role}</div>
          <div style={{ fontSize: 9, lineHeight: 1.5, marginTop: 8, maxWidth: 280 }}>{p.summary}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={p.avatar} alt="Profile" style={{ width: 85, height: 85, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${accentColor}` }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 9, color: mc, lineHeight: 1.8 }}>
          <div>{p.email} ✉</div>
          <div>+1 202-555-0166 ☎</div>
          <div>{p.loc} 📍</div>
          <div>linkedin.com/in/{p.name.toLowerCase().replace(' ', '')} 🔗</div>
          <div>portfolio.me 🌐</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, padding: '0 30px 30px' }}>
        {/* Left Column */}
        <div>
          <SecTitle>Work Experience</SecTitle>
          {[{ r: p.role, c: p.co1, yr: '2020 - Present' }, { r: 'Mid-Level Specialist', c: p.co2, yr: '2016 - 2020' }].map((j, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: tc }}>{j.r}</div>
                <div style={{ fontSize: 9, color: mc }}>{j.yr}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, marginBottom: 6 }}>{j.c}</div>
              <div style={{ fontSize: 9, lineHeight: 1.5 }}>
                • Successfully managed and delivered high-impact projects within budget.<br />
                • Implemented new strategies that increased efficiency by 25%.<br />
                • Collaborated with cross-functional teams to drive growth.
              </div>
            </div>
          ))}

          <SecTitle>Education</SecTitle>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: tc }}>Master of Science / MBA</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>Top Global University</div>
            <div style={{ fontSize: 9, color: mc, marginTop: 2 }}>2012 - 2016</div>
          </div>

          <SecTitle>Languages</SecTitle>
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
            {lc.slice(0, 3).map(l => (
              <div key={l.l} style={{ marginBottom: 5 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tc }}>{l.l}</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i <= l.d ? accentColor : (lt ? '#e5e7eb' : 'rgba(255,255,255,0.1)') }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <SecTitle>Skills</SecTitle>
          {p.skills.slice(0, 10).map(s => (
            <div key={s} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: tc }}>{s}</div>
              </div>
              <div style={{ height: 5, background: lt ? '#e5e7eb' : 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${70 + (s.length * 3) % 30}%`, background: accentColor, borderRadius: 10 }} />
              </div>
            </div>
          ))}

          <SecTitle>Honours & Awards</SecTitle>
          <div style={{ fontSize: 9, lineHeight: 1.6 }}>
            <div>• Winner of Global Innovation Award (2022)</div>
            <div>• Dean's List for Academic Excellence</div>
            <div>• Certified Professional Achievement</div>
          </div>

          <SecTitle>Organizations</SecTitle>
          <div style={{ fontSize: 9, lineHeight: 1.6 }}>
            <div>• Member of Professional Industry Association</div>
            <div>• Volunteer at Tech for Good Non-Profit</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LAYOUT PICKER — assigns one of 11 layouts to each template
   deterministically based on id + category
   ============================================================ */
/* ── LAYOUT 11 · Gemini Pro — Inspired by ResumeGemini ── */
function Layout11({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const mainBg = lt ? '#ffffff' : '#0f172a';
  const tc = lt ? '#1a202c' : '#f8fafc';
  const bc = lt ? '#4a5568' : 'rgba(255,255,255,0.8)';
  const mc = lt ? '#718096' : 'rgba(255,255,255,0.5)';
  const geminiBlue = '#3c68b1';
  const accentColor = acc || geminiBlue;

  const SectionLine = () => (
    <div style={{ height: 1, background: accentColor, width: '100%', margin: '8px 0', opacity: 0.3 }} />
  );

  const DateBadge = ({ children }) => (
    <div style={{ background: accentColor, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 4 }}>
      {children}
    </div>
  );

  return (
    <div style={{ background: mainBg, minHeight: 500, fontFamily: 'Arial, sans-serif', color: bc }}>
      {/* Name Box Header */}
      <div style={{ padding: '30px 40px', background: lt ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderBottom: `4px solid ${accentColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: accentColor, letterSpacing: '1px' }}>{p.name.toUpperCase()}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tc, marginTop: 4, letterSpacing: '0.5px' }}>{p.role}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: mc, lineHeight: 1.6 }}>
            <div>📍 {p.loc}</div>
            <div>✉ {p.email}</div>
            <div>☏ +1 234 567 890</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 35, padding: '25px 40px' }}>
        {/* Left Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: tc, marginBottom: 5 }}>PROFESSIONAL PROFILE</div>
          <SectionLine />
          <div style={{ fontSize: 9.5, lineHeight: 1.6, marginBottom: 20 }}>{p.summary}</div>

          <div style={{ fontSize: 12, fontWeight: 900, color: tc, marginBottom: 5 }}>EXPERIENCE</div>
          <SectionLine />
          {[{ r: 'Senior Lead', c: p.co1, yr: '2020 - 2024' }, { r: 'Associate Specialist', c: p.co2, yr: '2016 - 2020' }].map((j, i) => (
            <div key={i} style={{ marginBottom: 15 }}>
              <DateBadge>{j.yr}</DateBadge>
              <div style={{ fontSize: 11, fontWeight: 800, color: tc }}>{j.r}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, marginBottom: 4 }}>{j.c}</div>
              <div style={{ fontSize: 9, lineHeight: 1.5, color: bc }}>
                • Accelerated business growth by 45% through innovative strategic planning.<br />
                • Optimized team workflow and internal communications.
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: tc, marginBottom: 5 }}>CORE COMPETENCIES</div>
          <SectionLine />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {p.skills.slice(0, 10).map(s => (
              <div key={s} style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: accentColor }}>■</span> {s}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 900, color: tc, marginBottom: 5 }}>EDUCATION</div>
          <SectionLine />
          <div style={{ marginBottom: 15 }}>
            <DateBadge>2012 - 2016</DateBadge>
            <div style={{ fontSize: 10, fontWeight: 800, color: tc }}>Master of Science / MBA</div>
            <div style={{ fontSize: 9, color: mc }}>Top Tier University | Honors</div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 900, color: tc, marginBottom: 5 }}>LANGUAGES</div>
          <SectionLine />
          {lc.slice(0, 3).map(l => (
            <div key={l.l} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: tc }}>{l.l}</span>
                <span style={{ fontSize: 8, color: mc }}>{l.lv}</span>
              </div>
              <div style={{ height: 4, background: lt ? '#edf2f7' : 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${l.d * 20}%`, background: accentColor, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── LAYOUT 12 · ResumeGemini Official — EXACT REPLICA OF USER IMAGE ── */
function Layout12({ p, acc, bg, lc }) {
  const lt = isLight(bg);
  const accent = acc || '#3c68b1';
  const sidebarBg = '#fdfdfd';
  const tc = '#1a202c';
  const bc = '#4a5568';

  const SecTitle = ({ icon, children }) => (
    <div style={{ marginBottom: 12, marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accent, fontSize: 13, fontWeight: 800 }}>
        <span>{icon}</span>
        <span style={{ textTransform: 'capitalize' }}>{children}</span>
      </div>
      <div style={{ height: 1, background: accent, opacity: 0.25, marginTop: 4 }} />
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: 1120, width: 794, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', border: '1px solid #eee' }}>
      {/* Top Header Row: Photo + Name/Title */}
      <div style={{ padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${accent}`, flexShrink: 0 }}>
          <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, background: accent, padding: '20px 30px', borderRadius: 12, color: '#fff' }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '0.5px' }}>{p.name}</div>
          <div style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>{p.role}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '32% 68%', flex: 1 }}>
        {/* Left Sidebar */}
        <div style={{ padding: '0 40px 40px', borderRight: '1px solid #eee' }}>
          <div style={{ fontSize: 10, color: bc, lineHeight: 2.2, marginBottom: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: accent }}>📞</span> {p.email.replace('@email.com', '@phone.com')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: accent }}>✉</span> {p.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: accent }}>🌐</span> https://resumegemini.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: accent }}>📍</span> {p.loc}
            </div>
          </div>

          <SecTitle icon="📊">Skills</SecTitle>
          <div style={{ paddingLeft: 5 }}>
            {p.skills.slice(0, 12).map(s => (
              <div key={s} style={{ fontSize: 10, color: bc, marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: accent, fontSize: 12 }}>•</span> {s}
              </div>
            ))}
          </div>

          <SecTitle icon="🗣️">Language</SecTitle>
          <div style={{ paddingLeft: 5 }}>
            {lc.map(l => (
              <div key={l.l} style={{ fontSize: 10, color: bc, marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: accent, fontSize: 12 }}>•</span> {l.l}
              </div>
            ))}
          </div>
        </div>

        {/* Main Body */}
        <div style={{ padding: '0 40px 40px' }}>
          {/* Professional Summary Box */}
          <div style={{ background: accent, borderRadius: 8, padding: '15px 20px', color: '#fff', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <span>👤</span> Professional Summary
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 1.6, opacity: 0.95 }}>{p.summary}</div>
          </div>

          <SecTitle icon="🎓">Education</SecTitle>
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: tc }}>IIT Kanpur</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <div style={{ fontSize: 10, color: bc }}>MS - Computer Science, CGPA: 9.0</div>
              <div style={{ background: accent, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>Jun 2012</div>
            </div>
            <div style={{ fontSize: 10, color: accent, fontStyle: 'italic', marginTop: 2 }}>Kanpur, UP</div>
          </div>

          <SecTitle icon="💼">Experience</SecTitle>
          {[{ co: p.co1, r: p.role, d: 'Jun 2018 - Jan 2024', loc: 'San Francisco, California' }, { co: p.co2, r: 'Senior Software Engineer', d: 'Aug 2012 - May 2018', loc: 'San Jose, California' }].map((j, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: tc }}>{j.co}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: bc }}>{j.r}</div>
                <div style={{ background: accent, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{j.d}</div>
              </div>
              <div style={{ fontSize: 10, color: accent, fontStyle: 'italic', marginTop: 2 }}>{j.loc}</div>
              <div style={{ fontSize: 10, color: bc, lineHeight: 1.6, marginTop: 6 }}>
                • Delivered critical high-impact projects on time and within budget, exceeding expectations.<br />
                • Successfully led cross-functional teams of developers and designers.<br />
                • Identified and implemented cloud cost-saving strategies resulting in 20% savings.
              </div>
            </div>
          ))}

          <SecTitle icon="🏆">Awards</SecTitle>
          <div style={{ fontSize: 10, color: bc, lineHeight: 1.8 }}>
            <div>• CEO's Choice Award, 2023</div>
            <div>• Excellence in Customer Partnership Award, 2021</div>
            <div>• Growth Mindset Pioneer Award, 2017</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LAYOUTS = [Layout0, Layout1, Layout2, Layout3, Layout4, Layout5, Layout6, Layout7, Layout8, Layout9, Layout10, Layout11, Layout12];
const CAT_BASE = { 'Tech & Engineering': 0, 'Finance & Banking': 1, 'Design & Creative': 2, 'Marketing & Sales': 3, 'Healthcare & Medical': 4, 'Executive & Leadership': 5, 'Academic & Research': 6, 'Legal & Compliance': 7, 'Consulting & Strategy': 8, 'Entry Level': 9, 'MBA & Business': 10, 'Government & Public': 11, 'Startup & Entrepreneurship': 12 };

function pickLayout(template) {
  // If template specifies layout, use it (0-12)
  if (template.layoutIndex !== undefined) return LAYOUTS[template.layoutIndex % LAYOUTS.length];

  // Prefer Layout12 (Gemini Official) or Layout11 (Gemini Pro) for MANY templates to satisfy user
  if (template.id % 2 === 0 || template.atsScore > 95) return Layout12;
  if (template.id % 3 === 0) return Layout11;

  const catBase = CAT_BASE[template.category] ?? 0;
  return LAYOUTS[(catBase + (template.id % LAYOUTS.length)) % LAYOUTS.length];
}


function pickPersona(template) {
  return PERSONAS[template.id % PERSONAS.length];
}

function pickLangs(template) {
  return LANG_SETS[template.id % LANG_SETS.length];
}

/* ============================================================
   RESUME PREVIEW — renders the right layout for each template
   ============================================================ */
function ResumePreview({ template, scaleFactor = 0.274 }) {
  const LayoutComp = pickLayout(template);
  const persona    = pickPersona(template);
  const langs      = pickLangs(template);
  const W          = 794;

  return (
    <div style={{
      width: W,
      transformOrigin: 'top left',
      transform: `scale(${scaleFactor})`,
      background: template.bg,
      overflow: 'hidden',
    }}>
      <LayoutComp p={persona} acc={template.accent} bg={template.bg} lc={langs} />
    </div>
  );
}

/* ============================================================
   TEMPLATE CARD
   ============================================================ */
function TemplateCard({ template, onSelect, onPreview }) {
  const [hovered, setHovered] = useState(false);
  const sc = s => s >= 96 ? '#10b981' : s >= 92 ? '#f59e0b' : '#60a5fa';
  const scale = 0.274;

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        border: `1.5px solid ${hovered ? template.accent : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        transform: hovered ? 'translateY(-6px) scale(1.015)' : 'none',
        boxShadow: hovered ? `0 18px 44px rgba(0,0,0,0.6),0 0 22px ${template.accent}28` : '0 3px 12px rgba(0,0,0,0.4)',
        background: '#0a0f1a', display: 'flex', flexDirection: 'column',
      }}>
      {/* Top badge */}
      <div style={{ background: template.bg, padding: '7px 11px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${template.accent}44`, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: template.accent, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{template.subcategory}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>TEMPLATE #{String(template.id).padStart(3, '0')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: sc(template.atsScore), lineHeight: 1 }}>{template.atsScore}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>ATS</div>
        </div>
      </div>
      {/* Preview - Strictly Resume Content ONLY */}
      <div style={{ position: 'relative', height: 218, overflow: 'hidden', background: template.bg, flexShrink: 0 }}>
        <div style={{ pointerEvents: 'none' }}>
           <ResumePreview template={template} scaleFactor={scale} />
        </div>

        {/* Shadow for edge definition */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${isLight(template.bg) ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.4)'})` }} />

        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,9,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'fadeIn 0.2s' }}>
            <button onClick={e => { e.stopPropagation(); onPreview(template); }}
              style={{ padding: '8px 13px', borderRadius: 9, fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer' }}>
              👁 Preview
            </button>
            <button onClick={e => { e.stopPropagation(); onSelect(template); }}
              style={{ padding: '8px 13px', borderRadius: 9, fontSize: 11, fontWeight: 800, background: `linear-gradient(90deg,${template.accent},${template.accent}cc)`, border: 'none', color: '#060910', cursor: 'pointer', boxShadow: `0 4px 14px ${template.accent}44` }}>
              ✓ Use This
            </button>
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{padding:'10px 12px',background:'#0a0f1a',flex:1}}>
        <div style={{fontWeight:800,fontSize:13,color:'#e2e8f0',marginBottom:6}}>{template.name}</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {template.tags.slice(0,3).map(t=>(
            <span key={t} style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:`${template.accent}14`,border:`1px solid ${template.accent}28`,color:template.accent,fontWeight:700}}>{t}</span>
          ))}
          <span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#475569',fontWeight:700}}>{template.level}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PREVIEW MODAL
   ============================================================ */
function PreviewModal({ template, onClose, onSelect }) {
  if (!template) return null;
  const W = 794, scale = 0.68;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:20,backdropFilter:'blur(10px)',overflowY:'auto'}} onClick={onClose}>
      <div style={{width:W*scale+48,background:'#0d1117',borderRadius:20,overflow:'hidden',border:`2px solid ${template.accent}44`,marginTop:10,boxShadow:`0 32px 80px rgba(0,0,0,0.85)`,animation:'fadeUp 0.2s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:template.bg,padding:'18px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`2px solid ${template.accent}44`}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:isLight(template.bg)?'#111827':'#ffffff'}}>{template.name}</div>
            <div style={{fontSize:11,color:template.accent,fontFamily:'monospace',marginTop:2}}>{template.category} · {template.level} · ATS {template.atsScore}/100</div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <button onClick={()=>{onSelect(template);onClose();}} style={{padding:'10px 22px',borderRadius:10,fontWeight:800,fontSize:13,background:`linear-gradient(90deg,${template.accent},${template.accent}cc)`,border:'none',color:'#060910',cursor:'pointer',boxShadow:`0 0 24px ${template.accent}44`}}>
              ✓ Use Template
            </button>
            <button onClick={onClose} style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#94a3b8',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
        </div>
        <div style={{padding:24,background:'#060910',display:'flex',justifyContent:'center'}}>
          <div style={{width:W*scale,height:620,overflow:'hidden',borderRadius:8,boxShadow:'0 8px 40px rgba(0,0,0,0.6)',border:`1px solid ${template.accent}22`}}>
            <div style={{width:W,transformOrigin:'top left',transform:`scale(${scale})`}}>
              <ResumePreview template={template} scaleFactor={1}/>
            </div>
          </div>
        </div>
        <div style={{padding:'14px 24px 20px',background:'#0d1117',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,color:'#475569',fontFamily:'monospace',marginRight:4}}>Tags:</span>
          {template.tags.map(t=>(
            <span key={t} style={{fontSize:10,padding:'3px 10px',borderRadius:100,background:`${template.accent}14`,border:`1px solid ${template.accent}28`,color:template.accent,fontWeight:700}}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN GALLERY
   ============================================================ */
export default function TemplateGallery({ onSelect }) {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [level,    setLevel]    = useState('All');
  const [sortBy,   setSort]     = useState('ats');
  const [preview,  setPreview]  = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = ALL_TEMPLATES;
    if (category!=='All') list=list.filter(t=>t.category===category);
    if (level!=='All')    list=list.filter(t=>t.level===level);
    if (search.trim()) {
      const q=search.toLowerCase();
      list=list.filter(t=>t.name.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||(t.subcategory||'').toLowerCase().includes(q)||(t.tags||[]).some(tag=>tag.toLowerCase().includes(q)));
    }
    const s=[...list];
    if (sortBy==='ats')  s.sort((a,b)=>(b.atsScore||0)-(a.atsScore||0));
    if (sortBy==='id')   s.sort((a,b)=>a.id-b.id);
    if (sortBy==='name') s.sort((a,b)=>a.name.localeCompare(b.name));
    return s;
  },[search,category,level,sortBy]);

  const handleSelect = t => { setSelected(t); onSelect?.(t); };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h2 style={{margin:0,fontSize:24,fontWeight:900,color:'#e2e8f0',letterSpacing:'-0.02em'}}>
              Resume Templates
              <span style={{fontSize:14,fontWeight:500,color:'#475569',marginLeft:10,fontFamily:'monospace'}}>
                ({filtered.length} templates)
              </span>
            </h2>
            <div style={{fontSize:12,color:'#475569',fontFamily:'monospace',marginTop:4}}>
              250 professionally designed templates — each with a unique layout
            </div>
          </div>
          {selected&&(
            <div style={{padding:'10px 16px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:12,fontSize:12,color:'#10b981',fontWeight:700}}>
              ✓ Selected: <strong>{selected.name}</strong>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:220,position:'relative'}}>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates, categories, tags..."
            style={{width:'100%',padding:'10px 12px 10px 36px',borderRadius:10,boxSizing:'border-box',background:'#0d1117',border:'1px solid #1e293b',color:'#e2e8f0',fontSize:13,outline:'none'}}/>
        </div>
        <select value={level} onChange={e=>setLevel(e.target.value)}
          style={{padding:'10px 14px',borderRadius:10,background:'#0d1117',border:'1px solid #1e293b',color:'#e2e8f0',fontSize:12,cursor:'pointer'}}>
          {['All Levels','Entry','Mid','Senior','Executive'].map(l=><option key={l} value={l==='All Levels'?'All':l}>{l}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSort(e.target.value)}
          style={{padding:'10px 14px',borderRadius:10,background:'#0d1117',border:'1px solid #1e293b',color:'#e2e8f0',fontSize:12,cursor:'pointer'}}>
          <option value="ats">Sort: ATS Score</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="id">Sort: Template #</option>
        </select>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        {['All',...TEMPLATE_CATEGORIES.filter(c=>c!=='All')].map(cat=>(
          <button key={cat} onClick={()=>setCategory(cat)}
            style={{padding:'7px 14px',borderRadius:100,fontSize:12,fontWeight:700,background:category===cat?'#00e5ff':'rgba(255,255,255,0.04)',border:`1px solid ${category===cat?'#00e5ff':'rgba(255,255,255,0.1)'}`,color:category===cat?'#060910':'#94a3b8',cursor:'pointer',transition:'all 0.12s',whiteSpace:'nowrap'}}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length===0?(
        <div style={{textAlign:'center',padding:'60px 24px',color:'#334155'}}>
          <div style={{fontSize:36,marginBottom:12}}>🎨</div>
          <div style={{fontSize:15,fontWeight:700,color:'#475569'}}>No templates match</div>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:18}}>
          {filtered.map(t=><TemplateCard key={t.id} template={t} onSelect={handleSelect} onPreview={setPreview}/>)}
        </div>
      )}

      {preview&&<PreviewModal template={preview} onClose={()=>setPreview(null)} onSelect={handleSelect}/>}
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
