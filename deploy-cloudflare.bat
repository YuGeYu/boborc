@echo off
setlocal
cd /d "%~dp0"

set "PROJECT_NAME=bobo-river-clash"

echo [1/2] Build site
call npm run build
if errorlevel 1 goto :fail

echo [2/2] Deploy to Cloudflare Pages: %PROJECT_NAME%
wrangler pages deploy dist --project-name %PROJECT_NAME%
if errorlevel 1 goto :fail

echo.
echo [DONE] Deploy completed.
goto :end

:fail
echo.
echo [FAILED] Deploy stopped.

:end
pause
endlocal
