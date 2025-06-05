@echo off
echo ========================================
echo  GitLab AI DevOps Companion
echo  Development Server Launcher
echo ========================================
echo.

REM Verificar archivos necesarios
if not exist "service-account-key.json" (
    echo ERROR: service-account-key.json not found!
    echo Please create your Google Cloud service account key first.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo ERROR: backend\.env file not found!
    echo Please create the .env file in the backend folder.
    pause
    exit /b 1
)

REM Iniciar el servidor
echo Starting development server...
cd backend
npm run dev:windows