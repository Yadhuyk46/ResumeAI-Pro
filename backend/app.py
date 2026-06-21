import os, re, json, datetime, logging, sqlite3, fitz
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from docx import Document
import requests
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config.update(
    JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY', 'resumeai-pro-secret-2024-xk9'),
    JWT_ACCESS_TOKEN_EXPIRES=datetime.timedelta(hours=12),
    MAX_CONTENT_LENGTH=10 * 1024 * 1024,
)
CORS(app, origins='*', supports_credentials=True)
JWTManager(app)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)
UPLOAD_FOLDER = 'uploads'
DB_PATH = os.getenv('DB_PATH', 'resumeai.db')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
OLLAMA_URL   = os.getenv('OLLAMA_URL', 'http://localhost:11434')

# Performance Optimization: Global Session for connection pooling
http = requests.Session()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA journal_mode = WAL')
    return conn

def init_db():
    conn = get_db(); c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
            role TEXT DEFAULT "user", is_active INTEGER DEFAULT 1,
            avatar_color TEXT DEFAULT "#00e5ff",
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_login TEXT
        );
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            filename TEXT, overall_score INTEGER, ats_score INTEGER,
            readability_score INTEGER, job_match_score INTEGER,
            candidate_name TEXT, current_role TEXT, experience_years TEXT,
            word_count INTEGER, result_json TEXT, job_description TEXT,
            original_text TEXT, template_name TEXT, layout_index INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
        CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at);

        CREATE TABLE IF NOT EXISTS skills_master (
            id INTEGER PRIMARY KEY AUTOINCREMENT, skill_name TEXT UNIQUE NOT NULL,
            category TEXT DEFAULT "General", added_by INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
            body TEXT NOT NULL, priority TEXT DEFAULT "normal",
            admin_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            analysis_id INTEGER, rating INTEGER CHECK(rating BETWEEN 1 AND 5),
            comment TEXT, status TEXT DEFAULT "pending",
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ''')
    for sql in ["ALTER TABLE analyses ADD COLUMN original_text TEXT",
                "ALTER TABLE analyses ADD COLUMN template_name TEXT",
                "ALTER TABLE analyses ADD COLUMN layout_index INTEGER"]:
        try: c.execute(sql)
        except: pass
    for name, email, color in [
        ('Admin Alpha','admin1@resumeai.com','#00e5ff'),('Admin Beta','admin2@resumeai.com','#7c3aed'),
        ('Admin Gamma','admin3@resumeai.com','#10b981'),('Admin Delta','admin4@resumeai.com','#f59e0b'),
        ('Admin Omega','admin5@resumeai.com','#f472b6'),
    ]:
        if not c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone():
            c.execute('INSERT INTO users(name,email,password,role,avatar_color) VALUES(?,?,?,?,?)',
                      (name,email,generate_password_hash('Admin@1234'),'admin',color))
    for skill, cat in [
        ('Python','Programming'),('JavaScript','Programming'),('TypeScript','Programming'),
        ('Java','Programming'),('C++','Programming'),('Go','Programming'),
        ('React','Frontend'),('Vue.js','Frontend'),('Angular','Frontend'),('HTML/CSS','Frontend'),
        ('Flask','Backend'),('Django','Backend'),('Node.js','Backend'),('FastAPI','Backend'),
        ('PostgreSQL','Database'),('MySQL','Database'),('MongoDB','Database'),('Redis','Database'),
        ('Machine Learning','AI/ML'),('Deep Learning','AI/ML'),('NLP','AI/ML'),
        ('Docker','DevOps'),('Kubernetes','DevOps'),('CI/CD','DevOps'),('Terraform','DevOps'),
        ('AWS','Cloud'),('Azure','Cloud'),('GCP','Cloud'),
        ('Git','Tools'),('Linux','Tools'),('REST API','Tools'),('GraphQL','Tools'),
        ('Leadership','Soft Skills'),('Communication','Soft Skills'),('Problem Solving','Soft Skills'),
    ]:
        try: c.execute('INSERT INTO skills_master(skill_name,category) VALUES(?,?)',(skill,cat))
        except: pass
    admin = c.execute("SELECT id FROM users WHERE email='admin1@resumeai.com'").fetchone()
    if admin and not c.execute("SELECT id FROM announcements LIMIT 1").fetchone():
        c.execute("INSERT INTO announcements(title,body,priority,admin_id) VALUES(?,?,?,?)",
                  ("Welcome to ResumeAI Pro v3!",
                   "Upload your resume to get instant AI scores, ATS checks, and download a professionally fixed PDF using 250 templates.",
                   "high", admin['id']))
    conn.commit(); conn.close()
    log.info("DB initialized")
init_db()

def row_dict(row): return dict(row) if row else None

def extract_text(path, filename):
    ext = filename.rsplit('.',1)[-1].lower()
    if ext == 'pdf':
        doc = fitz.open(path)
        return "\n".join(p.get_text() for p in doc)
    elif ext == 'docx':
        return "\n".join(p.text for p in Document(path).paragraphs)
    else:
        with open(path,'r',errors='ignore') as f: return f.read()

def validate_file(filename):
    return '.' in filename and filename.rsplit('.',1)[-1].lower() in {'pdf','docx','txt'}

def is_admin():
    return get_jwt().get('role') == 'admin'

def require_admin():
    if not is_admin():
        return jsonify({'error':'Forbidden'}), 403
    return None

def paginate(rows, page, per_page):
    total = len(rows); start = (page-1)*per_page
    return {'items':rows[start:start+per_page],'total':total,'page':page,'per_page':per_page,'pages':(total+per_page-1)//per_page}

def _ai_generate(prompt, max_tokens=600, is_json=True):
    """
    Super-Fast Unified AI Caller.
    Prioritizes: Groq (Ultra-Fast) -> Gemini (Fast) -> Ollama (Local Fallback)
    """
    system_msg = "You are a professional resume expert. Return valid JSON only." if is_json else "You are a helpful AI Resume Assistant. Be concise and direct."

    # 1. Groq (Llama 3.1 - The fastest option)
    groq_key = os.getenv('GROQ_API_KEY')
    if groq_key:
        try:
            log.info(f"AI: Attempting Groq ({'JSON' if is_json else 'Text'})...")
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "system", "content": system_msg},
                             {"role": "user", "content": prompt}],
                "temperature": 0.0, # Faster & more deterministic
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"} if is_json else None
            }
            # Tighter timeout for faster user experience
            r = http.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=4)
            if r.status_code == 200:
                txt = r.json()['choices'][0]['message']['content']
                return json.loads(txt) if is_json else txt
            log.warning(f"Groq API returned {r.status_code}")
        except Exception as e: log.error(f"Groq error: {e}")

    # 2. Gemini 1.5 Flash (Second fastest)
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        try:
            log.info(f"AI: Attempting Gemini ({'JSON' if is_json else 'Text'})...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_msg}\n\n{prompt}"}]}],
                "generationConfig": {
                    "temperature": 0.0,
                    "maxOutputTokens": max_tokens,
                    "responseMimeType": "application/json" if is_json else "text/plain"
                }
            }
            r = http.post(url, json=payload, timeout=7)
            if r.status_code == 200:
                txt = r.json()['candidates'][0]['content']['parts'][0]['text']
                if is_json:
                    txt = re.sub(r'^```(?:json)?\s*', '', txt, flags=re.MULTILINE)
                    txt = re.sub(r'```\s*$', '', txt, flags=re.MULTILINE).strip()
                return json.loads(txt) if is_json else txt
            log.warning(f"Gemini API returned {r.status_code}")
        except Exception as e: log.error(f"Gemini error: {e}")

    # 3. Ollama (Local Fallback - optimized for speed)
    try:
        log.info(f"AI: Attempting Ollama Local Fallback ({OLLAMA_MODEL})...")
        r = http.post(f"{OLLAMA_URL}/api/generate", json={
            "model": OLLAMA_MODEL, "prompt": f"{system_msg}\n\n{prompt}", "stream": False, "format": "json" if is_json else "",
            "options": {"num_predict": max_tokens, "temperature": 0.0, "num_ctx": 1024}
        }, timeout=35)
        if r.status_code == 200:
            txt = r.json().get("response", "").strip()
            if is_json:
                txt = re.sub(r'^```(?:json)?\s*', '', txt, flags=re.MULTILINE)
                txt = re.sub(r'```\s*$', '', txt, flags=re.MULTILINE).strip()
                return json.loads(txt)
            return txt
    except Exception as e: log.error(f"Ollama fallback error: {e}")

    # Final Local Fallback if all AI fails (Ultra Fast)
    if is_json:
        return {"candidate_name": "Analysis Complete", "summary": "AI extraction failed, scores generated locally."}
    return "I am currently experiencing high latency. How can I help you today?"



def _smart_scores(text, job_desc=''):
    """
    Fast local scoring that never needs Ollama.
    Produces realistic scores based on resume content analysis.
    """
    words   = text.split()
    wc      = len(words)
    low     = text.lower()

    # ── Section detection ──────────────────────────────────────
    has_contact     = any(k in low for k in ['email','phone','linkedin','github','@','mobile'])
    has_experience  = any(k in low for k in ['experience','work','employment','position','company','worked'])
    has_education   = any(k in low for k in ['education','university','college','degree','bachelor','master','phd','b.tech','m.tech','b.e','mba'])
    has_skills      = any(k in low for k in ['skills','technologies','tools','programming','frameworks','languages'])
    has_projects    = any(k in low for k in ['project','built','developed','implemented','created'])
    has_achievements= any(k in low for k in ['achievement','award','certificate','certification','honor','recognition','won','ranked'])
    has_summary     = any(k in low for k in ['summary','objective','profile','about'])
    has_numbers     = bool(re.search(r'\b\d+[%+x]\b|\b\d{4}\b|\b\d+\s*(years?|months?|users?|clients?|projects?)', low))

    sections_count  = sum([has_contact, has_experience, has_education, has_skills, has_projects, has_achievements])

    # ── ATS keywords ──────────────────────────────────────────
    ats_keywords = ['python','java','javascript','react','node','sql','aws','docker','git',
                    'agile','scrum','api','machine learning','data','cloud','linux','kubernetes',
                    'tensorflow','pandas','excel','powerpoint','management','leadership','communication',
                    'c++','typescript','mongodb','postgresql','flask','django','spring','angular']
    found_kw = [k for k in ats_keywords if k in low]

    # ── Score computation ─────────────────────────────────────
    # Base from word count (very short resumes score low)
    wc_base = min(30, max(0, (wc - 50) * 30 // 450))   # 0 at 50 words, 30 at 500+ words

    # Section completeness  (max 30)
    section_score = min(30, sections_count * 5)

    # Keyword density (max 20)
    kw_score = min(20, len(found_kw) * 2)

    # Quantified achievements bonus (max 10)
    quant_bonus = 10 if has_numbers else 0

    # Summary bonus
    summary_bonus = 5 if has_summary else 0

    overall = wc_base + section_score + kw_score + quant_bonus + summary_bonus
    overall = max(28, min(88, overall))

    # ATS: penalise if missing key sections, reward keywords
    ats = wc_base + min(25, sections_count * 4) + min(25, len(found_kw) * 2) + (5 if has_numbers else 0)
    ats = max(25, min(85, ats))

    # Readability: word count + structure
    read = 40 + min(20, wc // 25) + (section_score // 2) + (5 if wc < 700 else 0)
    read = max(30, min(88, read))

    # Job match
    if job_desc.strip():
        jd_low = job_desc.lower()
        jd_words = set(re.findall(r'\b\w{4,}\b', jd_low))
        resume_words = set(re.findall(r'\b\w{4,}\b', low))
        overlap = len(jd_words & resume_words)
        jm = min(90, max(20, 30 + overlap * 2))
    else:
        jm = overall - 5

    impact  = min(85, max(25, overall - 5 + (5 if has_numbers else -5)))
    fmt     = min(88, max(30, read - 5 + (5 if has_summary else 0)))

    sections = {
        "contact_info":    20 if has_contact    else 5,
        "work_experience": 22 if has_experience else 5,
        "education":       18 if has_education  else 5,
        "skills":          20 if has_skills     else 5,
        "projects":        15 if has_projects   else 3,
        "achievements":    12 if has_achievements else 2,
    }

    return {
        "overall_score":     overall,
        "ats_score":         ats,
        "readability_score": read,
        "job_match_score":   int(jm),
        "impact_score":      impact,
        "format_score":      fmt,
        "sections":          sections,
        "keywords_found":    found_kw[:10],
    }


def analyze_with_ai(text, job_desc=''):
    """
    Super-Fast AI analysis using Groq/Gemini/Ollama.
    Phase 1: Instant local scores.
    Phase 2: Ultra-Fast AI extraction.
    """
    # ── Phase 1: instant local scores ─────────────────────────
    scores = _smart_scores(text, job_desc)

    # ── Phase 2: AI extraction (Optimized prompt) ─────────────
    excerpt = text[:1500]   # Balanced context for speed
    jd_hint = f"\nJD: {job_desc[:200]}" if job_desc.strip() else ""

    ai_prompt = f"""Extract details from this resume. Output VALID JSON ONLY.
{jd_hint}
RESUME:
{excerpt}
JSON:
{{
  "candidate_name": "",
  "current_role": "",
  "experience_years": "",
  "education_level": "",
  "industry": "",
  "summary": "",
  "top_skills": [],
  "keywords_missing": [],
  "strengths": [],
  "weaknesses": [],
  "recommendations": [{{"priority":"high","category":"ATS","text":""}}]
}}"""

    try:
        ai = _ai_generate(ai_prompt, max_tokens=500, is_json=True)
    except Exception as e:
        log.warning(f"AI Phase 2 failed: {e}")
        ai = _local_extract(text)

    # ── Merge results ──────────────────────────────────────────
    result = {**scores}
    fields = ['candidate_name','current_role','experience_years','education_level','industry','summary','top_skills','keywords_missing','strengths','weaknesses','recommendations']
    for field in fields:
        val = ai.get(field)
        if val: result[field] = val
        elif field not in result:
            result[field] = [] if field in ['top_skills','keywords_missing','strengths','weaknesses','recommendations'] else ''

    if not result.get('top_skills'):
        result['top_skills'] = [w for w in set(re.findall(r'\b[A-Z][a-zA-Z+#]{2,}\b', text)) if len(w) > 2][:6]

    return result


def _local_extract(text):
    """Pure-regex fallback when Ollama is unavailable."""
    low = text.lower()
    # Try to find a name (first line that looks like a name)
    name = ''
    for line in text.split('\n')[:8]:
        line = line.strip()
        if 2 <= len(line.split()) <= 4 and line.replace(' ','').isalpha() and line[0].isupper():
            name = line; break

    # Skills
    skill_kws = ['python','java','javascript','react','node','sql','aws','docker','git',
                 'machine learning','tensorflow','pandas','excel','c++','typescript',
                 'mongodb','postgresql','flask','django','spring','angular','kubernetes']
    skills = [k.title() for k in skill_kws if k in low][:6]

    return {
        "candidate_name": name,
        "current_role": "",
        "experience_years": "",
        "education_level": "",
        "industry": "",
        "summary": "Resume analysis completed using local scoring.",
        "top_skills": skills,
        "keywords_missing": ["Quantified achievements","LinkedIn URL","Summary section"] if not any(k in low for k in ['summary','objective']) else [],
        "strengths": ["Resume submitted for review"],
        "weaknesses": ["AI analysis unavailable — Ollama may be loading"],
        "recommendations": [{"priority":"high","category":"Setup","text":"Ensure Ollama is running: ollama serve && ollama run llama3.2:3b"}],
    }


def generate_fixed_resume_pdf(original_text, analysis, template_name, candidate_name, layout_index=None):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    # Convert layout_index to int if it's a string from form
    try: layout_index = int(layout_index) if layout_index is not None else 10
    except: layout_index = 10

    # Professional Colors based on layout_index (to simulate frontend variety)
    schemes = [
        ('#111827', '#3b82f6'), # Dark / Blue
        ('#065f46', '#10b981'), # Green
        ('#1e1b4b', '#818cf8'), # Indigo
        ('#431407', '#f97316'), # Orange
        ('#1e293b', '#00e5ff'), # Slate / Cyan
        ('#1a1a1a', '#d4af37'), # Black / Gold
        ('#1a365d', '#3182ce'), # Navy
        ('#2d3748', '#e53e3e'), # Red
        ('#2c7a7b', '#38b2ac'), # Teal
        ('#44337a', '#9f7aea'), # Purple
        ('#111827', '#3b82f6'), # Layout 10
        ('#3c68b1', '#3c68b1'), # Layout 11 (Gemini Blue)
    ]
    primary_hex, accent_hex = schemes[layout_index % len(schemes)]
    DARK = colors.HexColor(primary_hex); ACCENT = colors.HexColor(accent_hex)
    GREY = colors.HexColor('#64748b'); LIGHT = colors.HexColor('#f3f4f6')

    # Styles
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle('H1', fontSize=24, textColor=DARK, spaceAfter=2, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', fontSize=12, textColor=DARK, spaceBefore=10, spaceAfter=6, fontName='Helvetica-Bold', leftIndent=12)
    role_style = ParagraphStyle('Role', fontSize=12, textColor=ACCENT, fontName='Helvetica-Bold', spaceAfter=10)
    body = ParagraphStyle('Body', fontSize=9, textColor=colors.HexColor('#374151'), leading=13, spaceAfter=4, fontName='Helvetica')
    bul = ParagraphStyle('Bul', fontSize=9, textColor=colors.HexColor('#374151'), leading=13, spaceAfter=2, leftIndent=20, fontName='Helvetica')
    sm = ParagraphStyle('Sm', fontSize=8, textColor=GREY, leading=11, alignment=TA_CENTER)

    story = []
    name = (candidate_name or analysis.get('candidate_name') or 'Your Name').strip()
    role = (analysis.get('current_role') or 'Professional').strip()

    # LAYOUT VARIATIONS
    # Layout Type A: Centered Header (0, 2, 4, 6, 8, 10)
    # Layout Type B: Split Header (1, 3, 5, 7, 9)
    # Layout Type C: Gemini Style (11)
    if layout_index == 11:
        # Gemini Style: Solid top border, prominent name
        story.append(Spacer(1, 10))
        story.append(Paragraph(name.upper(), h1))
        story.append(Paragraph(role, role_style))
        contact_text = f"✉ {analysis.get('email', 'contact@email.com')} | 📍 {analysis.get('location', 'Global')} | 🔗 linkedin.com/in/{name.lower().replace(' ','')}"
        story.append(Paragraph(contact_text, sm))
        story.append(Spacer(1, 5))
    elif layout_index % 2 == 0:
        story.append(Paragraph(name.upper(), ParagraphStyle('H1C', parent=h1, alignment=TA_CENTER)))
        story.append(Paragraph(role, ParagraphStyle('RoleC', parent=role_style, alignment=TA_CENTER)))
        contact_text = f"✉ {analysis.get('email', 'contact@email.com')} | 📍 {analysis.get('location', 'Global')} | 🔗 linkedin.com/in/{name.lower().replace(' ','')}"
        story.append(Paragraph(contact_text, sm))
        story.append(Spacer(1, 10))
    else:
        header_data = [[
            [Paragraph(name.upper(), h1), Paragraph(role, role_style)],
            [Paragraph(f"✉ {analysis.get('email', 'contact@email.com')}<br/>📍 {analysis.get('location', 'Global')}<br/>🔗 linkedin.com/in/{name.lower().replace(' ','')}", sm)]
        ]]
        head_table = Table(header_data, colWidths=[12*cm, 6*cm])
        head_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('ALIGN', (1,0), (1,0), 'RIGHT')]))
        story.append(head_table)

    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=15))

    left_content = []
    left_content.append(Paragraph("PROFESSIONAL PROFILE", sec_style))
    ai_summary = analysis.get('summary') or "Experienced professional with a proven track record of delivering high-impact results."
    left_content.append(Paragraph(ai_summary, body))

    left_content.append(Paragraph("WORK EXPERIENCE", sec_style))
    lines = [l.strip() for l in (original_text or '').split('\n') if l.strip()]
    exp_lines = []
    in_exp = False
    for line in lines:
        low = line.lower()
        if any(kw in low for kw in ['experience','employment','work history','career']): in_exp = True; continue
        if in_exp and any(kw in low for kw in ['education','skills','projects','certifications']): in_exp = False
        if in_exp: exp_lines.append(line)

    if exp_lines:
        for line in exp_lines[:20]:
            if len(line) > 60: left_content.append(Paragraph(line, body))
            else: left_content.append(Paragraph(f"<b>{line}</b>", body))
    else:
        left_content.append(Paragraph("<b>Senior Role - Major Corporation</b>", body))
        left_content.append(Paragraph("• Led strategic initiatives resulting in 20% growth.", bul))
        left_content.append(Paragraph("• Managed cross-functional teams and stakeholders.", bul))

    left_content.append(Paragraph("EDUCATION", sec_style))
    edu = analysis.get('education_level') or "Bachelor's Degree in Related Field"
    left_content.append(Paragraph(f"<b>{edu}</b>", body))
    left_content.append(Paragraph("Top University · Graduated with Honors", body))

    right_content = []
    score = analysis.get('overall_score', 85)
    right_content.append(Paragraph("ATS SCORE", sec_style))
    score_table = Table([[Paragraph(f"<font size='20' color='{accent_hex}'><b>{score}</b></font><br/><font size='8' color='#64748b'>/100</font>", sm)]], colWidths=[4.5*cm])
    score_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), LIGHT), ('ROUNDEDCORNERS', [10,10,10,10]), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('PADDING', (0,0), (-1,-1), 10)]))
    right_content.append(score_table)

    right_content.append(Paragraph("CORE SKILLS", sec_style))
    skills = analysis.get('top_skills') or ['Leadership', 'Strategy', 'Communication', 'Technical']
    for s in skills[:10]:
        right_content.append(Paragraph(f"✦ {s}", body))

    right_content.append(Paragraph("AI RECOMMENDATIONS", sec_style))
    for r in (analysis.get('recommendations') or [])[:5]:
        txt = r.get('text','') if isinstance(r,dict) else str(r)
        right_content.append(Paragraph(f"• {txt}", body))

    # COLUMN LAYOUT VARIATION
    # Even layout_index: Left-heavy (Main content left, stats right)
    # Odd layout_index: Right-heavy (Stats left, Main content right)
    if layout_index % 2 == 0:
        main_data = [[left_content, right_content]]
        main_table = Table(main_data, colWidths=[11.5*cm, 6.5*cm])
        main_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (1,0), (1,0), 20)]))
    else:
        main_data = [[right_content, left_content]]
        main_table = Table(main_data, colWidths=[6.5*cm, 11.5*cm])
        main_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('RIGHTPADDING', (0,0), (0,0), 20)]))

    story.append(main_table)
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREY))
    story.append(Paragraph(f"Generated by ResumeAI Pro • Professional Template: {template_name} (Layout #{layout_index})", sm))

    doc.build(story); buf.seek(0); return buf

def _hex(color):
    """Convert reportlab Color to #rrggbb string for use in Paragraph markup."""
    return f"#{int(color.red*255):02x}{int(color.green*255):02x}{int(color.blue*255):02x}"

def generate_pdf_report(data):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    DARK=colors.HexColor('#060910'); ACCENT=colors.HexColor('#00e5ff')
    GREEN=colors.HexColor('#10b981'); RED=colors.HexColor('#ef4444')
    WARN=colors.HexColor('#f59e0b'); GREY=colors.HexColor('#64748b'); LIGHT=colors.HexColor('#e2e8f0')
    def score_color(n):
        if n is None: return GREY
        return GREEN if n>=75 else (WARN if n>=50 else RED)
    h1=ParagraphStyle('H1',fontSize=20,textColor=DARK,spaceAfter=4,fontName='Helvetica-Bold')
    h2=ParagraphStyle('H2',fontSize=13,textColor=DARK,spaceAfter=6,spaceBefore=14,fontName='Helvetica-Bold')
    h3=ParagraphStyle('H3',fontSize=10,textColor=ACCENT,spaceAfter=4,fontName='Helvetica-Bold')
    body=ParagraphStyle('Body',fontSize=9,textColor=colors.HexColor('#374151'),leading=14,spaceAfter=4)
    small=ParagraphStyle('Small',fontSize=8,textColor=GREY,leading=12)
    center=ParagraphStyle('Ctr',fontSize=9,alignment=TA_CENTER,textColor=GREY)
    story=[]; story.append(Paragraph("ResumeAI Pro — Analysis Report",h1))
    story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y at %H:%M')}",small))
    story.append(HRFlowable(width="100%",thickness=2,color=ACCENT,spaceAfter=12))
    story.append(Paragraph("Candidate Overview",h2))
    info_data=[['Name',data.get('candidate_name','—'),'Role',data.get('current_role','—')],
               ['Experience',data.get('experience_years','—'),'Industry',data.get('industry','—')],
               ['Education',data.get('education_level','—'),'Word Count',str(data.get('word_count','—'))]]
    t=Table(info_data,colWidths=[3.5*cm,6.5*cm,3.5*cm,4.5*cm])
    t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),9),
        ('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(2,0),(2,-1),'Helvetica-Bold'),
        ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#f8fafc'),colors.white]),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),('PADDING',(0,0),(-1,-1),6)]))
    story.append(t); story.append(Spacer(1,12))
    story.append(Paragraph("Score Breakdown",h2))
    score_fields=[('Overall Score',data.get('overall_score')),('ATS Score',data.get('ats_score')),
                  ('Readability',data.get('readability_score')),('Impact Score',data.get('impact_score')),
                  ('Format Score',data.get('format_score')),('Job Match',data.get('job_match_score'))]
    score_rows=[]; row=[]
    for label,val in score_fields:
        col=score_color(val) if val else GREY
        cell=f"<b><font color='{_hex(col)}'>{val if val is not None else 'N/A'}/100</font></b><br/><font size='8' color='#64748b'>{label}</font>"
        row.append(Paragraph(cell,ParagraphStyle('sc',fontSize=10,alignment=TA_CENTER,leading=14)))
        if len(row)==3: score_rows.append(row); row=[]
    if row: score_rows.append(row+['']*(3-len(row)))
    st=Table(score_rows,colWidths=[5.5*cm,5.5*cm,5.5*cm])
    st.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#f0f9ff'),colors.HexColor('#f8fafc')]),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),('PADDING',(0,0),(-1,-1),10)]))
    story.append(st); story.append(Spacer(1,12))
    story.append(Paragraph("Section Analysis",h2))
    sec=data.get('sections',{})
    sec_map=[('Contact Info','contact_info',10),('Work Experience','work_experience',25),
             ('Education','education',15),('Skills','skills',20),('Projects','projects',15),('Achievements','achievements',15)]
    sec_data=[['Section','Score','Max','Rating']]
    for label,key,mx in sec_map:
        val=sec.get(key,0); pct=int((val/mx)*100) if mx else 0
        sec_data.append([label,str(val),str(mx),'Excellent' if pct>=80 else ('Good' if pct>=60 else ('Fair' if pct>=40 else 'Poor'))])
    st2=Table(sec_data,colWidths=[7*cm,2.5*cm,2.5*cm,5.5*cm])
    st2.setStyle(TableStyle([('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9),
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),LIGHT),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f8fafc')]),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),('PADDING',(0,0),(-1,-1),7),('ALIGN',(1,0),(2,-1),'CENTER')]))
    story.append(st2); story.append(Spacer(1,12))
    story.append(Paragraph("AI Assessment",h2))
    story.append(Paragraph(data.get('summary','—'),body)); story.append(Spacer(1,8))
    story.append(Paragraph("Strengths",h3))
    for s in data.get('strengths',[]): story.append(Paragraph(f"✓  {s}",body))
    story.append(Spacer(1,6)); story.append(Paragraph("Areas for Improvement",h3))
    for w in data.get('weaknesses',[]): story.append(Paragraph(f"✗  {w}",body))
    story.append(Spacer(1,12)); story.append(Paragraph("Recommendations",h2))
    for r in data.get('recommendations',[]):
        p=r.get('priority','medium') if isinstance(r,dict) else 'medium'
        cat=r.get('category','General') if isinstance(r,dict) else 'General'
        txt=r.get('text','') if isinstance(r,dict) else str(r)
        col=RED if p=='high' else (WARN if p=='medium' else GREEN)
        story.append(Paragraph(f"<font color='{_hex(col)}'>[{p.upper()}] {cat}</font> — {txt}",body))
    story.append(Spacer(1,12))
    story.append(Paragraph("Top Skills",h3)); story.append(Paragraph(', '.join(data.get('top_skills',[])) or '—',body))
    story.append(Paragraph("Keywords Found",h3)); story.append(Paragraph(', '.join(data.get('keywords_found',[])) or '—',body))
    story.append(Paragraph("Missing Keywords",h3)); story.append(Paragraph(', '.join(data.get('keywords_missing',[])) or 'None',body))
    story.append(Spacer(1,16)); story.append(HRFlowable(width="100%",thickness=1,color=colors.HexColor('#e2e8f0')))
    story.append(Paragraph("Generated by ResumeAI Pro v3",center))
    doc.build(story); buf.seek(0); return buf

# ── AUTH ──────────────────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    d=request.get_json(silent=True) or {}
    name=(d.get('name') or '').strip(); email=(d.get('email') or '').strip().lower(); password=d.get('password','')
    if not all([name,email,password]): return jsonify({'error':'All fields required'}),400
    if len(password)<6: return jsonify({'error':'Password must be at least 6 characters'}),400
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$',email): return jsonify({'error':'Invalid email format'}),400
    colors_list=['#00e5ff','#7c3aed','#10b981','#f59e0b','#f472b6','#818cf8']
    color=colors_list[len(name)%len(colors_list)]
    conn=get_db()
    try:
        conn.execute('INSERT INTO users(name,email,password,avatar_color) VALUES(?,?,?,?)',(name,email,generate_password_hash(password),color))
        conn.commit(); return jsonify({'message':'Account created successfully'}),201
    except sqlite3.IntegrityError: return jsonify({'error':'Email already registered'}),409
    finally: conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    d=request.get_json(silent=True) or {}; email=(d.get('email') or '').strip().lower()
    conn=get_db(); user=conn.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
    if not user or not check_password_hash(user['password'],d.get('password','')): conn.close(); return jsonify({'error':'Invalid email or password'}),401
    if not user['is_active']: conn.close(); return jsonify({'error':'Account disabled. Contact support.'}),403
    conn.execute("UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?",(user['id'],)); conn.commit(); conn.close()
    token=create_access_token(identity=str(user['id']),additional_claims={'role':user['role'],'name':user['name'],'email':user['email']})
    return jsonify({'token':token,'role':user['role'],'name':user['name'],'email':user['email'],'avatar_color':user['avatar_color']})

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    uid=get_jwt_identity(); conn=get_db()
    user=conn.execute('SELECT id,name,email,role,is_active,avatar_color,created_at,last_login FROM users WHERE id=?',(uid,)).fetchone()
    conn.close(); return jsonify(row_dict(user))

@app.route('/api/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    uid=get_jwt_identity(); d=request.get_json(silent=True) or {}
    old_pwd,new_pwd=d.get('old_password',''),d.get('new_password','')
    if len(new_pwd)<6: return jsonify({'error':'Min 6 characters'}),400
    conn=get_db(); user=conn.execute('SELECT password FROM users WHERE id=?',(uid,)).fetchone()
    if not check_password_hash(user['password'],old_pwd): conn.close(); return jsonify({'error':'Current password incorrect'}),401
    conn.execute('UPDATE users SET password=? WHERE id=?',(generate_password_hash(new_pwd),uid)); conn.commit(); conn.close()
    return jsonify({'message':'Password updated'})

# ── USER ROUTES ───────────────────────────────────────────────
@app.route('/api/user/analyze', methods=['POST'])
@jwt_required()
def user_analyze():
    uid=get_jwt_identity()
    if 'resume' not in request.files: return jsonify({'error':'No file uploaded'}),400
    file=request.files['resume']
    job_desc=(request.form.get('job_description') or '').strip()
    template_name=(request.form.get('template_name') or '').strip()
    layout_index=request.form.get('layout_index')
    if not file.filename or not validate_file(file.filename): return jsonify({'error':'Only PDF, DOCX, TXT supported'}),400
    fname=secure_filename(file.filename)
    path=os.path.join(UPLOAD_FOLDER,f"{uid}_{int(datetime.datetime.now().timestamp())}_{fname}")
    file.save(path)
    try:
        text=extract_text(path,fname)
        if len(text.strip())<50: return jsonify({'error':'Could not extract sufficient text'}),400
        result=analyze_with_ai(text,job_desc)
        result['word_count']=len(text.split())
        conn=get_db()
        cur=conn.execute('''INSERT INTO analyses
            (user_id,filename,overall_score,ats_score,readability_score,job_match_score,
             candidate_name,current_role,experience_years,word_count,result_json,
             job_description,original_text,template_name,layout_index)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (uid,fname,result.get('overall_score'),result.get('ats_score'),
             result.get('readability_score'),result.get('job_match_score'),
             result.get('candidate_name'),result.get('current_role'),
             result.get('experience_years'),result.get('word_count'),
             json.dumps(result),job_desc[:2000] if job_desc else None,
             text[:8000],template_name or None, layout_index))
        aid=cur.lastrowid; conn.commit(); conn.close()
        result['analysis_id']=aid
        return jsonify({'success':True,'data':result})
    except Exception as e:
        log.error(f"Analysis error: {e}"); return jsonify({'error':str(e)}),500
    finally:
        if os.path.exists(path): os.remove(path)

@app.route('/api/user/analyses', methods=['GET'])
@jwt_required()
def user_analyses():
    uid=get_jwt_identity(); page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',10))
    search=request.args.get('search','').strip(); conn=get_db()
    q='SELECT id,filename,overall_score,ats_score,readability_score,job_match_score,candidate_name,current_role,word_count,created_at,template_name FROM analyses WHERE user_id=?'
    params=[uid]
    if search: q+=' AND (filename LIKE ? OR candidate_name LIKE ? OR current_role LIKE ?)'; params+=[f'%{search}%']*3
    q+=' ORDER BY created_at DESC'
    rows=[dict(r) for r in conn.execute(q,params).fetchall()]
    trend=conn.execute('SELECT overall_score,ats_score,created_at FROM analyses WHERE user_id=? ORDER BY created_at ASC LIMIT 10',(uid,)).fetchall()
    conn.close(); result=paginate(rows,page,per_page); result['trend']=[dict(r) for r in trend]; return jsonify(result)

@app.route('/api/user/analyses/<int:aid>', methods=['GET'])
@jwt_required()
def user_analysis_detail(aid):
    uid=get_jwt_identity(); conn=get_db()
    row=conn.execute('SELECT * FROM analyses WHERE id=? AND user_id=?',(aid,uid)).fetchone(); conn.close()
    if not row: return jsonify({'error':'Not found'}),404
    d=dict(row); d['result']=json.loads(d['result_json']) if d['result_json'] else {}
    del d['result_json']; d.pop('original_text',None); return jsonify(d)

@app.route('/api/user/analyses/<int:aid>', methods=['DELETE'])
@jwt_required()
def delete_analysis(aid):
    uid=get_jwt_identity(); conn=get_db()
    conn.execute('DELETE FROM analyses WHERE id=? AND user_id=?',(aid,uid)); conn.commit(); conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/user/analyses/<int:aid>/export-pdf', methods=['GET'])
@jwt_required()
def export_pdf(aid):
    uid=get_jwt_identity(); conn=get_db()
    row=conn.execute('SELECT * FROM analyses WHERE id=? AND user_id=?',(aid,uid)).fetchone(); conn.close()
    if not row: return jsonify({'error':'Not found'}),404
    d=dict(row); result=json.loads(d['result_json']) if d['result_json'] else {}
    result['word_count']=d.get('word_count')
    buf=generate_pdf_report(result)
    return send_file(buf,mimetype='application/pdf',as_attachment=True,download_name=f"ResumeAI_Report_{d['filename'].rsplit('.',1)[0]}.pdf")

@app.route('/api/user/analyses/<int:aid>/download-fixed', methods=['GET'])
@jwt_required()
def download_fixed_resume(aid):
    uid=get_jwt_identity(); conn=get_db()
    row=conn.execute('SELECT * FROM analyses WHERE id=? AND user_id=?',(aid,uid)).fetchone(); conn.close()
    if not row: return jsonify({'error':'Not found'}),404
    d=dict(row); result=json.loads(d['result_json']) if d['result_json'] else {}
    original_text=d.get('original_text') or ''; template_name=d.get('template_name') or 'Professional'
    layout_index=d.get('layout_index')
    candidate_name=d.get('candidate_name') or result.get('candidate_name') or ''
    buf=generate_fixed_resume_pdf(original_text,result,template_name,candidate_name,layout_index)
    safe_name=re.sub(r'[^\w]','_',candidate_name or 'Resume')
    return send_file(buf,mimetype='application/pdf',as_attachment=True,download_name=f"Fixed_Resume_{safe_name}_{template_name.replace(' ','_')}.pdf")

@app.route('/api/user/compare', methods=['POST'])
@jwt_required()
def compare_analyses():
    uid=get_jwt_identity(); d=request.get_json(silent=True) or {}; ids=d.get('ids',[])
    if len(ids)!=2: return jsonify({'error':'Provide exactly 2 analysis IDs'}),400
    conn=get_db(); rows=[]
    for aid in ids:
        row=conn.execute('SELECT * FROM analyses WHERE id=? AND user_id=?',(aid,uid)).fetchone()
        if not row: conn.close(); return jsonify({'error':f'Analysis {aid} not found'}),404
        item=dict(row); item['result']=json.loads(item['result_json']) if item['result_json'] else {}
        del item['result_json']; item.pop('original_text',None); rows.append(item)
    conn.close(); return jsonify({'analyses':rows})

@app.route('/api/user/stats', methods=['GET'])
@jwt_required()
def user_stats():
    uid=get_jwt_identity(); conn=get_db()
    stats={'total':conn.execute('SELECT COUNT(*) FROM analyses WHERE user_id=?',(uid,)).fetchone()[0],
           'avg_score':conn.execute('SELECT ROUND(AVG(overall_score),1) FROM analyses WHERE user_id=?',(uid,)).fetchone()[0] or 0,
           'best_score':conn.execute('SELECT MAX(overall_score) FROM analyses WHERE user_id=?',(uid,)).fetchone()[0] or 0,
           'avg_ats':conn.execute('SELECT ROUND(AVG(ats_score),1) FROM analyses WHERE user_id=?',(uid,)).fetchone()[0] or 0,
           'trend':[dict(r) for r in conn.execute('SELECT overall_score,ats_score,readability_score,created_at FROM analyses WHERE user_id=? ORDER BY created_at ASC LIMIT 12',(uid,)).fetchall()]}
    conn.close(); return jsonify(stats)

@app.route('/api/user/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    uid=get_jwt_identity(); d=request.get_json(silent=True) or {}
    if not d.get('comment','').strip(): return jsonify({'error':'Comment required'}),400
    rating=int(d.get('rating',5))
    if not 1<=rating<=5: return jsonify({'error':'Rating must be 1-5'}),400
    conn=get_db()
    conn.execute('INSERT INTO feedback(user_id,analysis_id,rating,comment) VALUES(?,?,?,?)',(uid,d.get('analysis_id'),rating,d.get('comment','').strip()))
    conn.commit(); conn.close(); return jsonify({'message':'Feedback submitted!'}),201

@app.route('/api/user/announcements', methods=['GET'])
@jwt_required()
def user_announcements():
    conn=get_db()
    rows=conn.execute('SELECT a.*,u.name as admin_name FROM announcements a JOIN users u ON a.admin_id=u.id ORDER BY a.created_at DESC LIMIT 20').fetchall()
    conn.close(); return jsonify([dict(r) for r in rows])

@app.route('/api/user/skills', methods=['GET'])
@jwt_required()
def list_skills():
    conn=get_db(); rows=conn.execute('SELECT * FROM skills_master ORDER BY category,skill_name').fetchall(); conn.close()
    cats={}
    for r in rows:
        d=dict(r); cats.setdefault(d['category'],[]).append(d)
    return jsonify({'by_category':cats,'all':[dict(r) for r in rows]})

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    uid=get_jwt_identity(); d=request.get_json(silent=True) or {}; conn=get_db()
    try:
        updates,params=[],[]
        for field in ['name','email','avatar_color']:
            val=(d.get(field) or '').strip()
            if val: updates.append(f'{field}=?'); params.append(val)
        if not updates: conn.close(); return jsonify({'error':'Nothing to update'}),400
        params.append(uid); conn.execute(f'UPDATE users SET {",".join(updates)} WHERE id=?',params); conn.commit()
        user=conn.execute('SELECT id,name,email,role,is_active,avatar_color,created_at FROM users WHERE id=?',(uid,)).fetchone()
        conn.close(); return jsonify(row_dict(user))
    except sqlite3.IntegrityError: conn.close(); return jsonify({'error':'Email already in use'}),409
    except Exception as e: conn.close(); return jsonify({'error':str(e)}),500

@app.route('/api/user/password', methods=['PUT'])
@jwt_required()
def update_user_password():
    uid=get_jwt_identity(); d=request.get_json(silent=True) or {}
    current=d.get('current_password',''); new_pw=d.get('new_password','')
    if len(new_pw)<6: return jsonify({'error':'Min 6 characters'}),400
    conn=get_db(); user=conn.execute('SELECT password FROM users WHERE id=?',(uid,)).fetchone()
    if not user or not check_password_hash(user['password'],current): conn.close(); return jsonify({'error':'Current password incorrect'}),401
    conn.execute('UPDATE users SET password=? WHERE id=?',(generate_password_hash(new_pw),uid)); conn.commit(); conn.close()
    return jsonify({'message':'Password updated'})

# ── ADMIN ROUTES ──────────────────────────────────────────────
@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    err=require_admin()
    if err: return err
    conn=get_db()
    stats={
        'total_users':conn.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
        'active_users':conn.execute("SELECT COUNT(*) FROM users WHERE role='user' AND is_active=1").fetchone()[0],
        'total_analyses':conn.execute("SELECT COUNT(*) FROM analyses").fetchone()[0],
        'analyses_today':conn.execute("SELECT COUNT(*) FROM analyses WHERE DATE(created_at)=DATE('now')").fetchone()[0],
        'analyses_week':conn.execute("SELECT COUNT(*) FROM analyses WHERE created_at >= datetime('now','-7 days')").fetchone()[0],
        'avg_score':conn.execute("SELECT ROUND(AVG(overall_score),1) FROM analyses").fetchone()[0] or 0,
        'avg_ats':conn.execute("SELECT ROUND(AVG(ats_score),1) FROM analyses").fetchone()[0] or 0,
        'total_feedback':conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0],
        'avg_rating':conn.execute("SELECT ROUND(AVG(rating),1) FROM feedback").fetchone()[0] or 0,
        'total_admins':conn.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0],
        'total_skills':conn.execute("SELECT COUNT(*) FROM skills_master").fetchone()[0],
    }
    daily=conn.execute("SELECT DATE(created_at) as day,COUNT(*) as count,ROUND(AVG(overall_score),1) as avg_score FROM analyses WHERE created_at >= datetime('now','-7 days') GROUP BY DATE(created_at) ORDER BY day").fetchall()
    stats['daily_chart']=[dict(r) for r in daily]
    dist=conn.execute("SELECT SUM(CASE WHEN overall_score>=80 THEN 1 ELSE 0 END) as excellent,SUM(CASE WHEN overall_score>=60 AND overall_score<80 THEN 1 ELSE 0 END) as good,SUM(CASE WHEN overall_score>=40 AND overall_score<60 THEN 1 ELSE 0 END) as average,SUM(CASE WHEN overall_score<40 THEN 1 ELSE 0 END) as poor FROM analyses").fetchone()
    stats['score_distribution']=dict(dist) if dist else {}
    recent=conn.execute('SELECT a.id,a.filename,a.overall_score,a.ats_score,a.created_at,u.name as user_name FROM analyses a JOIN users u ON a.user_id=u.id ORDER BY a.created_at DESC LIMIT 8').fetchall()
    stats['recent_analyses']=[dict(r) for r in recent]
    top_users=conn.execute("SELECT u.name,COUNT(a.id) as count,ROUND(AVG(a.overall_score),1) as avg FROM users u JOIN analyses a ON u.id=a.user_id WHERE u.role='user' GROUP BY u.id ORDER BY count DESC LIMIT 5").fetchall()
    stats['top_users']=[dict(r) for r in top_users]; conn.close(); return jsonify(stats)

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_list_users():
    err=require_admin()
    if err: return err
    page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',15))
    search=request.args.get('search','').strip(); role_filter=request.args.get('role','user')
    conn=get_db()
    q="SELECT u.id,u.name,u.email,u.role,u.is_active,u.avatar_color,u.created_at,u.last_login,COUNT(a.id) as analysis_count FROM users u LEFT JOIN analyses a ON u.id=a.user_id WHERE 1=1"
    params=[]
    if role_filter!='all': q+=" AND u.role=?"; params.append(role_filter)
    if search: q+=' AND (u.name LIKE ? OR u.email LIKE ?)'; params+=[f'%{search}%']*2
    q+=' GROUP BY u.id ORDER BY u.created_at DESC'
    rows=[dict(r) for r in conn.execute(q,params).fetchall()]; conn.close()
    return jsonify(paginate(rows,page,per_page))

@app.route('/api/admin/users/<int:uid>', methods=['GET'])
@jwt_required()
def admin_user_detail(uid):
    err=require_admin()
    if err: return err
    conn=get_db()
    user=conn.execute('SELECT id,name,email,role,is_active,avatar_color,created_at,last_login FROM users WHERE id=?',(uid,)).fetchone()
    if not user: conn.close(); return jsonify({'error':'User not found'}),404
    analyses_count=conn.execute('SELECT COUNT(*) FROM analyses WHERE user_id=?',(uid,)).fetchone()[0]
    avg_row=conn.execute('SELECT AVG(overall_score) FROM analyses WHERE user_id=?',(uid,)).fetchone()
    avg_score=round(avg_row[0]) if avg_row[0] else None
    recent=conn.execute('SELECT id,filename,overall_score,ats_score,created_at,template_name FROM analyses WHERE user_id=? ORDER BY created_at DESC LIMIT 5',(uid,)).fetchall()
    conn.close(); result=row_dict(user)
    result['analyses_count']=analyses_count; result['avg_score']=avg_score
    result['recent_analyses']=[row_dict(r) for r in recent]; return jsonify(result)

@app.route('/api/admin/users/<int:uid>', methods=['PUT'])
@jwt_required()
def admin_update_user(uid):
    err=require_admin()
    if err: return err
    d=request.get_json(silent=True) or {}; conn=get_db()
    user=conn.execute('SELECT role FROM users WHERE id=?',(uid,)).fetchone()
    if not user: conn.close(); return jsonify({'error':'User not found'}),404
    if user['role']=='admin': conn.close(); return jsonify({'error':'Cannot modify admin'}),403
    updates,params=[],[]
    if 'is_active' in d: updates.append('is_active=?'); params.append(int(d['is_active']))
    if not updates: conn.close(); return jsonify({'error':'Nothing to update'}),400
    params.append(uid); conn.execute(f'UPDATE users SET {",".join(updates)} WHERE id=?',params); conn.commit()
    updated=conn.execute('SELECT id,name,email,role,is_active,avatar_color,created_at FROM users WHERE id=?',(uid,)).fetchone()
    conn.close(); return jsonify(row_dict(updated))

@app.route('/api/admin/users/<int:uid>/toggle', methods=['POST'])
@jwt_required()
def toggle_user(uid):
    err=require_admin()
    if err: return err
    conn=get_db(); user=conn.execute('SELECT is_active,role FROM users WHERE id=?',(uid,)).fetchone()
    if not user: conn.close(); return jsonify({'error':'Not found'}),404
    if user['role']=='admin': conn.close(); return jsonify({'error':'Cannot disable admin'}),403
    new_status=0 if user['is_active'] else 1
    conn.execute('UPDATE users SET is_active=? WHERE id=?',(new_status,uid)); conn.commit(); conn.close()
    return jsonify({'is_active':new_status})

@app.route('/api/admin/users/<int:uid>', methods=['DELETE'])
@jwt_required()
def delete_user(uid):
    err=require_admin()
    if err: return err
    conn=get_db(); user=conn.execute('SELECT role FROM users WHERE id=?',(uid,)).fetchone()
    if not user: conn.close(); return jsonify({'error':'Not found'}),404
    if user['role']=='admin': conn.close(); return jsonify({'error':'Cannot delete admin'}),403
    conn.execute('DELETE FROM users WHERE id=?',(uid,)); conn.commit(); conn.close()
    return jsonify({'message':'User deleted'})

@app.route('/api/admin/analyses', methods=['GET'])
@jwt_required()
def admin_all_analyses():
    err=require_admin()
    if err: return err
    page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',12))
    search=request.args.get('search','').strip()
    score_min=request.args.get('score_min',type=int); score_max=request.args.get('score_max',type=int)
    conn=get_db()
    q='SELECT a.id,a.filename,a.overall_score,a.ats_score,a.readability_score,a.candidate_name,a.current_role,a.word_count,a.created_at,a.template_name,u.name as user_name,u.email as user_email,u.id as user_id FROM analyses a JOIN users u ON a.user_id=u.id WHERE 1=1'
    params=[]
    if search: q+=' AND (u.name LIKE ? OR a.filename LIKE ? OR a.candidate_name LIKE ?)'; params+=[f'%{search}%']*3
    if score_min is not None: q+=' AND a.overall_score>=?'; params.append(score_min)
    if score_max is not None: q+=' AND a.overall_score<=?'; params.append(score_max)
    q+=' ORDER BY a.created_at DESC'
    rows=[dict(r) for r in conn.execute(q,params).fetchall()]; conn.close()
    return jsonify(paginate(rows,page,per_page))

@app.route('/api/admin/analyses/<int:aid>', methods=['GET'])
@jwt_required()
def admin_analysis_detail(aid):
    err=require_admin()
    if err: return err
    conn=get_db()
    row=conn.execute('SELECT a.*,u.name as user_name,u.email as user_email FROM analyses a JOIN users u ON a.user_id=u.id WHERE a.id=?',(aid,)).fetchone()
    conn.close()
    if not row: return jsonify({'error':'Not found'}),404
    d=dict(row); d['result']=json.loads(d['result_json']) if d['result_json'] else {}
    del d['result_json']; d.pop('original_text',None); return jsonify(d)

@app.route('/api/admin/analyses/<int:aid>', methods=['DELETE'])
@jwt_required()
def admin_delete_analysis(aid):
    err=require_admin()
    if err: return err
    conn=get_db(); conn.execute('DELETE FROM analyses WHERE id=?',(aid,)); conn.commit(); conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/admin/skills', methods=['GET','POST'])
@jwt_required()
def admin_skills():
    err=require_admin()
    if err: return err
    if request.method=='GET':
        conn=get_db(); rows=conn.execute('SELECT * FROM skills_master ORDER BY category,skill_name').fetchall(); conn.close()
        return jsonify([dict(r) for r in rows])
    d=request.get_json(silent=True) or {}
    if not d.get('skill_name','').strip(): return jsonify({'error':'Name required'}),400
    uid=get_jwt_identity(); conn=get_db()
    try:
        conn.execute('INSERT INTO skills_master(skill_name,category,added_by) VALUES(?,?,?)',(d['skill_name'].strip(),d.get('category','General'),uid))
        conn.commit(); conn.close(); return jsonify({'message':'Added'}),201
    except sqlite3.IntegrityError: conn.close(); return jsonify({'error':'Already exists'}),409

@app.route('/api/admin/skills/<int:sid>', methods=['DELETE'])
@jwt_required()
def delete_skill(sid):
    err=require_admin()
    if err: return err
    conn=get_db(); conn.execute('DELETE FROM skills_master WHERE id=?',(sid,)); conn.commit(); conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/admin/announcements', methods=['GET','POST'])
@jwt_required()
def admin_announcements():
    err=require_admin()
    if err: return err
    if request.method=='GET':
        conn=get_db()
        rows=conn.execute('SELECT a.*,u.name as admin_name FROM announcements a JOIN users u ON a.admin_id=u.id ORDER BY a.created_at DESC').fetchall()
        conn.close(); return jsonify([dict(r) for r in rows])
    d=request.get_json(silent=True) or {}
    if not d.get('title','').strip() or not d.get('body','').strip(): return jsonify({'error':'Title and body required'}),400
    uid=get_jwt_identity(); conn=get_db()
    conn.execute('INSERT INTO announcements(title,body,priority,admin_id) VALUES(?,?,?,?)',(d['title'].strip(),d['body'].strip(),d.get('priority','normal'),uid))
    conn.commit(); conn.close(); return jsonify({'message':'Posted'}),201

@app.route('/api/admin/announcements/<int:aid>', methods=['DELETE'])
@jwt_required()
def delete_announcement(aid):
    err=require_admin()
    if err: return err
    conn=get_db(); conn.execute('DELETE FROM announcements WHERE id=?',(aid,)); conn.commit(); conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/admin/feedback', methods=['GET'])
@jwt_required()
def admin_feedback():
    err=require_admin()
    if err: return err
    page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',10)); conn=get_db()
    rows=conn.execute('SELECT f.*,u.name as user_name,u.email as user_email FROM feedback f JOIN users u ON f.user_id=u.id ORDER BY f.created_at DESC').fetchall()
    conn.close(); return jsonify(paginate([dict(r) for r in rows],page,per_page))

@app.route('/api/admin/feedback/<int:fid>/status', methods=['POST'])
@jwt_required()
def update_feedback_status(fid):
    err=require_admin()
    if err: return err
    d=request.get_json(silent=True) or {}; conn=get_db()
    conn.execute('UPDATE feedback SET status=? WHERE id=?',(d.get('status','pending'),fid)); conn.commit(); conn.close()
    return jsonify({'message':'Updated'})

@app.route('/api/admin/feedback/<int:fid>', methods=['PUT'])
@jwt_required()
def update_feedback_v2(fid):
    err=require_admin()
    if err: return err
    d=request.get_json(silent=True) or {}; conn=get_db()
    conn.execute('UPDATE feedback SET status=? WHERE id=?',(d.get('status','reviewed'),fid)); conn.commit(); conn.close()
    return jsonify({'message':'Updated','status':d.get('status','reviewed')})

@app.route('/api/admin/admins', methods=['GET'])
@jwt_required()
def list_admins():
    err=require_admin()
    if err: return err
    conn=get_db()
    rows=conn.execute("SELECT id,name,email,avatar_color,is_active,created_at,last_login FROM users WHERE role='admin' ORDER BY id").fetchall()
    conn.close(); return jsonify([dict(r) for r in rows])

@app.errorhandler(413)
def too_large(e): return jsonify({'error':'File too large. Max 10MB.'}),413

@app.route('/api/health')
def health(): return jsonify({'status':'ok','version':'3.0'}),200

@app.errorhandler(404)
def not_found(e): return jsonify({'error':'Route not found'}),404

@app.errorhandler(500)
def server_error(e): return jsonify({'error':'Internal server error'}),500

# ═══════════════════════════════════════════════════════════════
# AI ASSISTANT (STREAMING CHAT) — Fast Ollama with context
# ═══════════════════════════════════════════════════════════════
@app.route('/api/user/assistant', methods=['POST'])
@jwt_required()
def ai_assistant():
    uid = get_jwt_identity()
    d = request.get_json(silent=True) or {}
    message = (d.get('message') or '').strip()
    history  = d.get('history', [])   # [{role, content}, ...]
    analysis_context = d.get('analysis_context', {})

    if not message:
        return jsonify({'error': 'Message required'}), 400

    # Build compact prompt (keep total tokens low for speed)
    ctx_line = ''
    if analysis_context and analysis_context.get('candidate_name'):
        skills_str = ', '.join((analysis_context.get('top_skills') or [])[:4])
        ctx_line = (f"[Resume context: {analysis_context.get('candidate_name')}, "
                    f"score {analysis_context.get('overall_score','?')}/100, "
                    f"ATS {analysis_context.get('ats_score','?')}/100, "
                    f"skills: {skills_str}]")

    # Keep last 6 turns of history for better conversation context
    hist_text = ''
    for h in history[-6:]:
        role = h.get('role','user')
        hist_text += f"\n{'Human' if role=='user' else 'Assistant'}: {str(h.get('content',''))[:300]}"

    full_prompt = (
        f"You are a helpful AI Career Assistant. Be direct and concise. {ctx_line}\n"
        f"You can answer anything related to careers, interviews, skills, or general questions the user may have.\n"
        f"{hist_text}\nHuman: {message[:1500]}\nAssistant:"
    )

    try:
        reply = _ai_generate(full_prompt, max_tokens=350, is_json=False)
        if not reply:
            reply = "Sorry, I couldn't generate a response. Try asking a shorter question."
        return jsonify({'reply': reply, 'success': True})

    except Exception as e:
        log.error(f"AI assistant error: {e}")
        return jsonify({'error': f'AI unavailable: {str(e)[:100]}. Please check your API keys or Ollama status.'}), 503


# ═══════════════════════════════════════════════════════════════
# ADMIN: Get all user uploads/analyses for AI Review module
# ═══════════════════════════════════════════════════════════════
@app.route('/api/admin/ai-analysis/users', methods=['GET'])
@jwt_required()
def admin_ai_analysis_users():
    """Returns all users enriched with real analysis data from DB."""
    err = require_admin()
    if err: return err
    conn = get_db()
    rows = conn.execute("""
        SELECT
            u.id, u.name, u.email, u.avatar_color, u.is_active,
            u.created_at, u.last_login,
            COUNT(a.id)                        AS analysis_count,
            ROUND(AVG(a.overall_score), 1)     AS avg_score,
            ROUND(AVG(a.ats_score), 1)         AS avg_ats,
            MAX(a.overall_score)               AS best_score,
            (SELECT a2.overall_score FROM analyses a2
             WHERE a2.user_id = u.id
             ORDER BY a2.created_at DESC LIMIT 1) AS latest_score,
            (SELECT a2.filename FROM analyses a2
             WHERE a2.user_id = u.id
             ORDER BY a2.created_at DESC LIMIT 1) AS latest_file,
            (SELECT a2.created_at FROM analyses a2
             WHERE a2.user_id = u.id
             ORDER BY a2.created_at DESC LIMIT 1) AS latest_date
        FROM users u
        LEFT JOIN analyses a ON u.id = a.user_id
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY analysis_count DESC, u.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/admin/ai-analysis/user/<int:uid>/analyses', methods=['GET'])
@jwt_required()
def admin_user_analyses_detail(uid):
    """Returns all analyses for a specific user (admin view)."""
    err = require_admin()
    if err: return err
    conn = get_db()
    rows = conn.execute("""
        SELECT id, filename, overall_score, ats_score, readability_score,
               job_match_score, candidate_name, current_role, experience_years,
               word_count, job_description, created_at, result_json
        FROM analyses WHERE user_id = ?
        ORDER BY created_at DESC
    """, (uid,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['result'] = json.loads(d['result_json']) if d['result_json'] else {}
        del d['result_json']
        result.append(d)
    return jsonify(result)

if __name__ == '__main__':
    port=int(os.getenv('PORT',5000))
    log.info(f"Starting ResumeAI Pro v3 on port {port}")
    app.run(debug=os.getenv('FLASK_DEBUG','true').lower()=='true', port=port, threaded=True)