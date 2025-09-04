@echo off
setlocal enabledelayedexpansion
echo ===========================================
echo    [UPDATE] Git Pull with Token - Simple Version
echo ===========================================
echo.

REM ===== GitHub Personal Access Token Configuration =====
set TOKEN=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

REM ===== Repository Configuration =====
set REPO_OWNER=SobhanRjz
set REPO_NAME=Oil_Drilling
set BRANCH=main

echo Repository: %REPO_OWNER%/%REPO_NAME% (Private)
echo Branch: %BRANCH%
echo [WARNING] Force pulling - will overwrite local changes...
echo.

REM Check if there are uncommitted changes
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository
    pause
    exit /b 1
)

echo [INFO] Checking for uncommitted changes...
git status --porcelain | findstr /r ".*" >nul
if not errorlevel 1 (
    echo [WARNING] Uncommitted changes found - these will be lost!
    echo [INFO] Changed files:
    git status --porcelain
    echo.
)

echo [INFO] Starting force pull...
echo.

echo [STEP 1] Fetching from remote...
git fetch https://oauth2:!TOKEN!@github.com/!REPO_OWNER!/!REPO_NAME!.git !BRANCH!:refs/remotes/temp/!BRANCH!
if errorlevel 1 (
    echo [ERROR] Fetch failed
    pause
    exit /b 1
)

echo [STEP 2] Resetting to remote state...
git reset --hard temp/!BRANCH!
if errorlevel 1 (
    echo [ERROR] Reset failed
    pause
    exit /b 1
)

echo [STEP 3] Final pull to sync...
git pull https://oauth2:!TOKEN!@github.com/!REPO_OWNER!/!REPO_NAME!.git !BRANCH!
if errorlevel 1 (
    echo [ERROR] Pull failed
    pause
    exit /b 1
)

echo.
echo ===========================================
echo    [SUCCESS] FORCE PULL COMPLETED!
echo ===========================================
echo.
echo Repository has been updated to match remote.
echo Any local changes have been overwritten.
echo.
pause
exit /b 0
