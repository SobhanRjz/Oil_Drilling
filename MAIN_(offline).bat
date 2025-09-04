@echo off
echo ===========================================
echo    [START] Drill DQ Data Quality Platform
echo ===========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Check if .venv exists, create if not
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo.
echo ===========================================
echo        Starting Drill DQ Server
echo ===========================================
echo.
echo Server will be available at:
echo   http://127.0.0.1:8000/login
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server in background
echo Starting server in background...
start /B uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

REM Wait a moment for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open browser
echo [BROWSER] Opening browser...
start http://127.0.0.1:8000/login

echo.
echo [OK] Server started successfully!
echo [INFO] Browser should open automatically
echo.
echo [TIP] If browser doesn't open, manually visit:
echo    http://127.0.0.1:8000/login
echo.
echo [STOP] Press Ctrl+C in this window to stop the server
echo.

REM Wait for server process
pause >nul

REM Cleanup
call .venv\Scripts\deactivate.bat
goto :end