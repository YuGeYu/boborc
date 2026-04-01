@echo off
setlocal
cd /d "%~dp0"

if "%~1"=="" goto :usage

set "COMMIT_MESSAGE=%*"

echo [1/3] Stage all changes
git add -A
if errorlevel 1 goto :fail

echo [2/3] Commit changes
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto :fail

echo [3/3] Push to GitHub main
git push origin main
if errorlevel 1 goto :fail

echo.
echo [DONE] GitHub push completed.
goto :end

:usage
echo.
echo Usage: publish-github.bat Your commit message
goto :end

:fail
echo.
echo [FAILED] GitHub publish stopped.

:end
pause
endlocal
