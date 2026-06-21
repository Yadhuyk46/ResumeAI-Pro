@echo off
TITLE ResumeAI Pro - Full Stack AI Resume Analyzer
COLOR 0B

echo ================================================================
echo         RESUME AI PRO - FULL STACK AI ANALYZER
echo ================================================================
echo.

:: 1. Setup Backend Environment
if not exist "backend\.env" (
    echo [!] .env file missing in backend. Creating from example...
    copy "backend\.env.example" "backend\.env"
    echo [!] ACTION REQUIRED: Open 'backend\.env' and add your GROQ_API_KEY
    echo     for 10x faster analysis.
    echo.
)

:: 2. Launch Backend in a new window
echo [*] Launching Backend Server (Flask)...
start "ResumeAI_Backend" cmd /k "cd backend && echo Installing requirements... && pip install -r requirements.txt && echo Starting Flask server... && python app.py"

:: 3. Launch Frontend in a new window
echo [*] Launching Frontend Dashboard (React)...
start "ResumeAI_Frontend" cmd /k "cd frontend && echo Installing dependencies (this may take a minute)... && npm install && echo Starting React development server... && npm start"

echo.
echo ================================================================
echo   SUCCESS: Both components are starting in separate windows.
echo.
echo   - BACKEND:  http://localhost:5000
echo   - FRONTEND: http://localhost:3000
echo.
echo   (Keep this window open if you want to see these logs)
echo ================================================================
pause
