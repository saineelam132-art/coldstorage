@echo off
REM KoolKisaan - double-click to start.
REM Uses Python 3.12 first (CoolProp needs it), via the Windows launcher "py -3.12".
REM Falls back to "python" only if Python 3.12 is not found.
REM If the Python version fails, the STATIC BACKUP (no Python) opens instead.
cd /d "%~dp0"

py -3.12 --version >nul 2>&1
if %errorlevel%==0 (
  set "PY=py -3.12"
) else (
  echo Python 3.12 not found with "py -3.12" - trying "python" instead.
  set "PY=python"
)

echo Starting KoolKisaan with: %PY%
%PY% run.py
if errorlevel 1 (
  echo.
  echo The Python version failed. Opening the STATIC BACKUP instead (no Python needed)...
  echo Tip: install the packages for Python 3.12 with:   py -3.12 -m pip install -r requirements.txt
  start "" "static_site\index.html"
  pause
)
