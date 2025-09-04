@echo off
setlocal enabledelayedexpansion
set "UNCOMMITTED_COUNT=0"
echo ===========================================
echo    [UPDATE] Git Pull with Token - Update Repository
echo ===========================================
echo Script Version: 2.0 - Force Pull with Safety Checks
echo.

REM ===== GitHub Personal Access Token Configuration =====
set TOKEN=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

REM ===== Repository Configuration =====
set REPO_OWNER=SobhanRjz
set REPO_NAME=Oil_Drilling
set BRANCH=main

echo Repository: %REPO_OWNER%/%REPO_NAME% (Private)
echo Branch: %BRANCH%
echo [WARNING] Force pulling latest changes (will overwrite local changes)...
echo.

REM Check for uncommitted changes
echo [INFO] Checking for uncommitted changes...
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository or git not available
    goto :error
)

REM Count uncommitted changes
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set UNCOMMITTED_COUNT=%%i

if !UNCOMMITTED_COUNT! gtr 0 (
    echo [WARNING] Found !UNCOMMITTED_COUNT! uncommitted changes
    echo [INFO] These will be permanently lost!

    REM Show what files have changes
    echo [INFO] Changed files:
    git status --porcelain

    echo.
    echo [QUESTION] Continue with force pull? (Y/N)
    set /p CONFIRM="Your choice: "

    if /i not "!CONFIRM!"=="Y" (
        echo [INFO] Force pull cancelled by user.
        echo [TIP] Commit or stash your changes first.
        pause
        exit /b 1
    )
)

REM Force pull latest changes with token authentication
echo [INFO] Fetching latest changes from remote...
git fetch https://oauth2:%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git

if errorlevel 1 (
    echo [ERROR] Failed to fetch from remote
    goto :error
)

echo [INFO] Force resetting local branch to match remote...
git reset --hard origin/%BRANCH%

if errorlevel 1 (
    echo [ERROR] Failed to reset local branch
    goto :error
)

echo [INFO] Pulling to ensure sync...
git pull https://oauth2:%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git %BRANCH%

if errorlevel 1 (
    echo [ERROR] Failed to complete pull operation
    goto :error
) else (
    echo.
    echo ===========================================
    echo    [SUCCESS] FORCE PULL COMPLETED!
    echo ===========================================
    echo.
    if !UNCOMMITTED_COUNT! gtr 0 (
        echo [WARNING] !UNCOMMITTED_COUNT! local changes have been permanently overwritten
    )
    echo Repository updated successfully from remote.
    echo.
    pause
)

goto :end

:error
echo.
echo ===========================================
echo    [ERROR] FORCE PULL FAILED!
echo ===========================================
echo.
echo [INFO] Possible causes:
echo 1. No internet connection
echo 2. Repository not initialized
echo 3. Authentication issues
echo 4. Permission denied on repository
echo 5. Remote repository not found
echo.
echo [FIX] Try these solutions:
echo 1. Check internet connection
echo 2. Verify token has 'repo' permissions
echo 3. Ensure repository exists and you have access
echo 4. Check if you're in the correct directory
echo 5. Run 'git status' to check repository state
echo.
pause
exit /b 1

:end
exit /b 0
