@echo off
echo ===========================================
echo    Drill DQ Data Quality Platform
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

REM Install/update requirements
echo Installing/updating packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install packages
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

REM Start the server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

REM If server stops, deactivate venv and exit
call .venv\Scripts\deactivate.bat
pause
