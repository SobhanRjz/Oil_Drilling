@echo off
echo ===========================================
echo    [UPDATE] Git Pull with Token - Update Repository
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
echo Pulling latest changes with token authentication...
echo.

REM Pull latest changes with token authentication
git pull https://oauth2:%TOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git %BRANCH%

if errorlevel 1 (
    echo.
    echo ===========================================
    echo    [ERROR] PULL FAILED!
    echo ===========================================
    echo.
    echo [INFO] Possible causes:
    echo 1. No internet connection
    echo 2. Repository not initialized
    echo 3. Merge conflicts
    echo 4. Authentication issues
    echo.
    echo [FIX] Try these solutions:
    echo 1. Check internet connection
    echo 2. Run 'git status' to check repository state
    echo 3. Resolve any merge conflicts
    echo 4. Ensure you're in the correct directory
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ===========================================
    echo    [SUCCESS] PULL SUCCESSFUL!
    echo ===========================================
    echo.
    echo Repository updated successfully.
    echo.
    pause
)

exit /b 0
