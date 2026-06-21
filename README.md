# ResumeAI Pro — Full Stack AI Resume Analyzer

## ⚡ Quick Start

### 1. One-Click Start (Windows)
Double-click `run_app.bat` in the root folder. 
This will automatically:
- Create your `.env` file if it's missing.
- Install Backend & Frontend dependencies.
- Start the Flask API and React Dashboard in separate windows.

---

### 2. Manual Setup

---

## 🚀 NEW: Powered by Fast Cloud AI (Optional)
This version now supports **Groq** and **Google Gemini** for lightning-fast resume analysis. 
- **Groq:** Uses Llama 3.1 8B/70B. Analysis takes ~2 seconds.
- **Gemini:** Uses Gemini 1.5 Flash. High accuracy and free tier.
- **Ollama:** Still works as a local fallback if no internet or API keys are provided.

To enable, just add your keys to `backend/.env`.

---

## 🔐 Default Login Credentials

| Role  | Email                 | Password    |
|-------|-----------------------|-------------|
| Admin | admin1@resumeai.com   | Admin@1234  |
| User  | demo@user.com         | demo123     |

*(These are auto-seeded when the app first starts)*

---

## ✅ All Bugs Fixed in This Version

### 1. ⬇ AI Fix → Downloadable PDF
- After AI fixes your resume, click **"⬇ Download Fixed Resume PDF"**
- Generates a clean, ATS-formatted PDF with your name, skills, strengths, AI recommendations, and all scores

### 2. 🤖 AI Assistant (New)
- Full chat assistant in the User Dashboard sidebar
- Powered by local Ollama `llama3.2:3b`
- Auto-loads your latest resume analysis as context
- Quick-question buttons for common queries
- Fast responses (optimized token limits)

### 3. 👥 Admin → Users Module
- Fixed `require_admin()` authentication check
- Users now display properly with pagination, search, activate/deactivate controls
- User detail modal shows analyses count, avg score, recent uploads

### 4. 🤖 Admin → AI Resume Analysis Module
- **No more hardcoded 6 users!**
- Now reads ALL real users + their actual analysis data from the database
- Shows avg score, analysis count, best score, latest score per user
- AI job-fit predictions and hire probability based on real data
- Click any user card to see all their uploaded resumes with scores
- Filter by status (Approved / Review / Needs Improvement), sort, and search

### 5. 🎨 250 Professional Templates
- All 250 templates across 14 industry categories fully available
- ATS scores and layout types properly set for each template

### 6. ⚡ Lightning Fast AI Analysis
- Switched to **Groq/Gemini** API support (Optional).
- Analysis time reduced from 30s+ (local Ollama) to **< 3 seconds** (Cloud API).
- AI assistant now responds instantly with Llama 3.1 8B.
- Automatic fallback to local Ollama if offline.
- Optimized JSON parsing with regex and markdown cleaning.

### 7. 🐛 Missing Components Fixed
All previously missing/broken component files created:
- `components/ui.js` — Modal, Card, Badge, Spinner, Avatar, Pagination, etc.
- `components/charts.js` — All Recharts wrappers
- `components/Sidebar.js` — Navigation sidebar
- `context/ToastContext.js` — Toast notification system
- `pages/LandingPage.js` — Home/marketing page
- `src/index.js` — React entry point
- `public/index.html` — HTML template with CSS variables

---

## 🏗️ Architecture

```
ResumeAIProV2_Fixed/
├── backend/
│   ├── app.py              # Flask API (929 lines)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── package.json
    └── src/
        ├── index.js
        ├── App.js
        ├── context/
        │   ├── AuthContext.js       # JWT auth state
        │   └── ToastContext.js      # Toast notifications
        ├── components/
        │   ├── ui.js               # All UI primitives
        │   ├── charts.js           # Recharts wrappers
        │   ├── Sidebar.js          # Navigation
        │   ├── TemplateGallery.js  # 250 templates
        │   └── AdminAIAnalysis.js  # Admin AI module (fixed)
        ├── data/
        │   └── templates.js        # 250 template definitions
        └── pages/
            ├── LandingPage.js
            ├── AuthPages.js        # Login + Register
            ├── admin/
            │   └── AdminDashboard.js
            └── user/
                └── UserDashboard.js
```

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/user/upload` | Upload & analyze resume |
| GET | `/api/user/analyses` | Get user's analyses |
| GET | `/api/user/analyses/:id/download-fixed` | **Download AI-fixed PDF** |
| POST | `/api/user/assistant` | **AI Assistant chat** |
| GET | `/api/admin/users` | Admin: list users |
| GET | `/api/admin/ai-analysis/users` | **Admin: all users with AI data** |
| GET | `/api/admin/ai-analysis/user/:id/analyses` | **Admin: user's analyses detail** |

---

## 🛠️ Environment Variables

```env
JWT_SECRET_KEY=change-this-in-production
FLASK_DEBUG=true
PORT=5000
DB_PATH=resumeai.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```
