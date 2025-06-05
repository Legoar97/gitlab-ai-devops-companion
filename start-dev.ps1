# start-dev.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GitLab AI DevOps Companion" -ForegroundColor Green
Write-Host " Development Server Launcher" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo de credenciales
if (!(Test-Path ".\service-account-key.json")) {
    Write-Host "ERROR: service-account-key.json not found!" -ForegroundColor Red
    Write-Host "Please run the following command first:" -ForegroundColor Yellow
    Write-Host "gcloud iam service-accounts keys create service-account-key.json --iam-account=gitlab-ai-companion@gitlab-ai-companion-2025.iam.gserviceaccount.com" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Verificar que existe el archivo .env en backend
if (!(Test-Path ".\backend\.env")) {
    Write-Host "ERROR: backend\.env file not found!" -ForegroundColor Red
    Write-Host "Please create the .env file in the backend folder with your configuration" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Instalar dependencias si no existen
if (!(Test-Path ".\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Limpiar la consola antes de iniciar
Clear-Host

# Mostrar información del servidor
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Development Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Server URL: http://localhost:4000" -ForegroundColor White
Write-Host "📊 GraphQL Playground: http://localhost:4000/graphql" -ForegroundColor White
Write-Host "🔧 Hot reload enabled" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
Set-Location backend
npm run dev:windows