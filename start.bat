@echo off
REM ColdTrust Twin - double-click to start (needs Python + the packages in requirements.txt)
cd /d "%~dp0"
python run.py
if errorlevel 1 (
  echo.
  echo Python version failed. Opening the STATIC BACKUP instead (no Python needed)...
  start "" "static_site\index.html"
  pause
)
