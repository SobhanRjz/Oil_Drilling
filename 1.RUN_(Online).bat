@echo off
setlocal enabledelayedexpansion

REM --- Config: supported Python range ---
set MINPY=3.10
set MAXPY=3.12

REM --- Find Python and version ---
for /f "tokens=2 delims= " %%v in ('python -V 2^>^&1') do set PYVER=%%v
echo Detected Python %PYVER%

REM Quick numeric check: reject 3.13+
echo %PYVER% | findstr /r "^3\.13" >nul && (
  echo [ERROR] Python 3.13 detected. Please install Python 3.10–3.12.
  exit /b 1
)

REM --- Recreate venv fresh ---
if exist .venv rmdir /s /q .venv
python -m venv .venv || (echo [ERROR] venv create failed & exit /b 1)
call .venv\Scripts\activate.bat || (echo [ERROR] venv activate failed & exit /b 1)

python -m pip install -U pip setuptools wheel
REM Avoid building from source for heavy libs:
pip install --only-binary=:all: -r requirements.txt || (
  echo [WARN] Binary wheels failed; trying normal install...
  pip install -r requirements.txt || (echo [ERROR] deps failed & exit /b 1)
)

REM Run server without relying on uvicorn.exe on PATH
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload


