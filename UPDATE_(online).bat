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
echo [WARNING] Force pulling latest changes (will overwrite local changes)...
echo.

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
    echo [WARNING] Local changes have been overwritten
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
