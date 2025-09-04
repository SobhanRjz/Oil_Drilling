@echo off
echo ===========================================
echo    🚀 Drill DQ Data Quality Platform
echo ===========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed!
    echo Please install Python 3.8+ from https://python.org
    echo.
    pause
    exit /b 1
)

REM Check if .venv exists, create if not
if not exist ".venv" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ❌ ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/update requirements
echo 📥 Installing/updating packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ ERROR: Failed to install packages
    pause
    exit /b 1
)

echo.
echo ===========================================
echo        🎯 Starting Drill DQ Server
echo ===========================================
echo.
echo 🌐 Server will be available at:
echo    http://127.0.0.1:8000/login
echo.
echo 📝 Instructions:
echo    1. Wait for "Application startup complete" message
echo    2. Browser will open automatically
echo    3. Use demo credentials: admin@example.com / admin123
echo    4. Press Ctrl+C to stop the server
echo.
echo 🔄 Starting server...

REM Start the server in background and open browser
start /B uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Try to open browser
echo 🌍 Opening browser...
start http://127.0.0.1:8000/login

echo.
echo ✅ Server started successfully!
echo 📱 Browser should open automatically
echo.
echo 💡 If browser doesn't open, manually visit:
echo    http://127.0.0.1:8000/login
echo.
echo 🛑 Press Ctrl+C in this window to stop the server
echo.

REM Wait for server process
pause >nul

REM Cleanup
call .venv\Scripts\deactivate.bat
