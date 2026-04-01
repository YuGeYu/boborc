@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 goto RUN_WITH_PY

where python >nul 2>nul
if not errorlevel 1 goto RUN_WITH_PYTHON

echo Python 3 was not found.
echo Please install Python 3 and try again.
pause
goto :eof

:RUN_WITH_PY
py -3 scripts\redeem_code_tool.py
if errorlevel 1 pause
goto :eof

:RUN_WITH_PYTHON
python scripts\redeem_code_tool.py
if errorlevel 1 pause
