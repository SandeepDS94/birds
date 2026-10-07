# ==============================================================================
# Windows Setup Script for Bird Sound Identification System
# Run in PowerShell: .\setup_windows.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Setting up AI Bird Sound Identification System (Windows)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Python Installation (prefer 3.10)
$pythonCmd = "python"
if (Get-Command "py" -ErrorAction SilentlyContinue) {
    $pyVer = py -3.10 --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $pythonCmd = "py -3.10"
        Write-Host "[✓] Found Python 3.10 via 'py -3.10'" -ForegroundColor Green
    } else {
        $pythonCmd = "python"
    }
}

# 2. Setup Backend Virtual Environment
Write-Host "`n[1/4] Setting up Python virtual environment in backend/venv..." -ForegroundColor Yellow
if (-not (Test-Path "backend\venv")) {
    Invoke-Expression "$pythonCmd -m venv backend\venv"
    Write-Host "[✓] Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "[i] backend\venv already exists." -ForegroundColor Gray
}

# 3. Create required directories
$dirs = @(
    "backend\tmp_uploads",
    "test_audio",
    "data",
    "database"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

# 4. Copy .env.example to .env if missing
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "[!] Created backend\.env from template. Remember to fill in your Supabase credentials!" -ForegroundColor Magenta
} else {
    Write-Host "[i] backend\.env already exists." -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "[!] Created frontend\.env from template. Remember to fill in your Supabase anon key!" -ForegroundColor Magenta
} else {
    Write-Host "[i] frontend\.env already exists." -ForegroundColor Gray
}

# 5. Install backend dependencies if requirements.txt exists
if (Test-Path "backend\requirements.txt") {
    Write-Host "`n[2/4] Installing backend dependencies..." -ForegroundColor Yellow
    & "backend\venv\Scripts\python.exe" -m pip install --upgrade pip
    & "backend\venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
    Write-Host "[✓] Backend dependencies installed." -ForegroundColor Green
}

# 6. Install frontend dependencies if package.json exists
if (Test-Path "frontend\package.json") {
    Write-Host "`n[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "[✓] Frontend dependencies installed." -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "Setup Completed Successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Configure backend\.env with your Supabase credentials." -ForegroundColor White
Write-Host "2. Configure frontend\.env with your Supabase anon key." -ForegroundColor White
Write-Host "3. Start backend: cd backend; .\venv\Scripts\python -m uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "4. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
