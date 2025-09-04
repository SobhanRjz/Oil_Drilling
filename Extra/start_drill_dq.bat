@echo off
setlocal enabledelayedexpansion

REM ===== GitHub Personal Access Token Configuration =====
set TOKEN=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

REM ===== Repository Configuration =====
set REPO_OWNER=SobhanRjz
set REPO_NAME=Oil_Drilling
set BRANCH=main

echo ===========================================
echo    [START] Drill DQ Setup Script
echo ===========================================
echo.
echo [LIST] This script will:
echo    PHASE 1: Clone/pull the repository
echo    PHASE 2: Setup Python virtual environment
echo    PHASE 3: Start the Drill DQ server
echo.
echo Repository: %REPO_OWNER%/%REPO_NAME%
echo.

echo ===========================================
echo    [DOWNLOAD] PHASE 1: Clone Repository
echo ===========================================
echo Repository: %REPO_OWNER%/%REPO_NAME% (Private)
echo Branch: %BRANCH%
echo.

REM Check if directory exists
if not exist "%REPO_NAME%" (
    echo [PACKAGE] Repository not found. Cloning...

    REM Try OAuth format first
    echo Trying OAuth authentication...
    git clone "https://oauth2:%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git" "%REPO_NAME%" 2>nul

    if errorlevel 1 (
        echo [ERROR] OAuth failed, trying direct token...
        rmdir /s /q "%REPO_NAME%" 2>nul
        git clone "https://%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git" "%REPO_NAME%" 2>nul

        if errorlevel 1 (
            echo [ERROR] Direct token failed, trying username:token...
            rmdir /s /q "%REPO_NAME%" 2>nul
            git clone "https://%REPO_OWNER%:%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git" "%REPO_NAME%" 2>nul

            if errorlevel 1 goto :clone_error
        )
    )

    echo [SUCCESS] Repository cloned successfully!
    cd "%REPO_NAME%"
    git remote set-url --push origin DISABLED

) else (
    echo [PACKAGE] Repository exists. Pulling latest changes...
    cd "%REPO_NAME%"
    git remote set-url --push origin DISABLED
    git pull origin %BRANCH%
    if errorlevel 1 goto :clone_error
    echo [SUCCESS] Repository updated successfully!
)

echo.
echo ===========================================
echo    [START] PHASE 2: Setup Python Environment
echo ===========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.8+ from https://python.org
    echo.
    goto :python_error
)

REM Check if .venv exists, create if not
if not exist ".venv" (
    echo [PACKAGE] Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        goto :python_error
    )
)

REM Activate virtual environment
echo [TOOL] Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    goto :python_error
)

REM Install/update requirements
echo [DOWNLOAD] Installing/updating packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install packages
    goto :python_error
)

echo.
echo ===========================================
echo    [TARGET] PHASE 3: Starting Drill DQ Server
echo ===========================================
echo.
echo [WEB] Server will be available at:
echo    http://127.0.0.1:8000/login
echo.
echo [NOTE] Instructions:
echo    1. Wait for "Application startup complete" message
echo    2. Browser will open automatically
echo    3. Use demo credentials: admin@example.com / admin123
echo    4. Press Ctrl+C to stop the server
echo.
echo [CYCLE] Starting server...

REM Start the server in background and open browser
start /B uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Try to open browser
echo [BROWSER] Opening browser...
start http://127.0.0.1:8000/login

echo.
echo [SUCCESS] Server started successfully!
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

:clone_error
echo.
echo ===========================================
echo    [ERROR] CLONE FAILED!
echo ===========================================
echo.
echo [SEARCH] Possible causes:
echo 1. Invalid GitHub Personal Access Token
echo 2. Repository doesn't exist or no access
echo 3. Network connection issues
echo 4. Token expired or missing permissions
echo.
echo [FIX] Quick fixes:
echo 1. Check token: https://github.com/settings/tokens
echo 2. Verify repository: https://github.com/%REPO_OWNER%/%REPO_NAME%
echo 3. Ensure token has 'repo' scope
echo.
pause
exit /b 1

:python_error
echo.
echo ===========================================
echo    [ERROR] PYTHON SETUP FAILED!
echo ===========================================
echo.
echo [SEARCH] Possible causes:
echo 1. Python not installed
echo 2. Virtual environment creation failed
echo 3. Package installation failed
echo.
echo [FIX] Solutions:
echo 1. Install Python 3.8+: https://python.org
echo 2. Check requirements.txt exists
echo 3. Run as administrator if needed
echo.
pause
exit /b 1

:end
echo.
echo [BYE] Session ended. Thanks for using Drill DQ!
echo.
exit /b 0
