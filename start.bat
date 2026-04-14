@echo off
echo Starting Ticketer...

:: Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo Error: Node.js is not installed. Please install Node.js from https://nodejs.org/
  pause
  exit /b
)

:: Install dependencies if node_modules is missing
IF NOT EXIST "node_modules\" (
  echo Installing dependencies...
  call npm install
)

:: Start the server
echo Starting the server...
npm start
pause
