@echo off
REM Quick Mobile Setup for Rabab Complex Stay - Windows

echo.
echo ========================================
echo   📱 Rabab Complex Stay - Mobile Testing Setup
echo ========================================
echo.

REM Get IPv4 address from ipconfig
echo 🔍 Detecting your IPv4 address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP=%%a
    REM Remove leading spaces
    set IP=!IP: =!
    goto :found
)

:found
if "%IP%"=="" (
    echo ❌ Could not detect IPv4 address.
    echo.
    echo Please run: ipconfig
    echo Look for "IPv4 Address" under your active Wi-Fi adapter
    echo.
    pause
    exit /b 1
)

echo ✅ Found IPv4: %IP%
echo.

REM Create frontend .env file
echo 📝 Configuring frontend...
cd frontend
(
echo # Mobile testing configuration - Auto-generated
echo # Generated on: %date% %time%
echo VITE_API_BASE_URL=http://%IP%:5000/api
) > .env

echo ✅ Created frontend/.env
cd ..
echo.

echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo 📋 Next Steps:
echo.
echo 1. Start Backend:
echo    cd backend
echo    npm run dev
echo.
echo 2. Start Frontend (in new terminal):
echo    cd frontend  
echo    npm run dev:mobile
echo.
echo 3. Open on your phone:
echo    http://%IP%:5173
echo.
echo 💡 Important:
echo    - Make sure your phone is on the SAME Wi-Fi network
echo    - If Windows Firewall blocks, allow Node.js
echo.
echo ========================================
pause
