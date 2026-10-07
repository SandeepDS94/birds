#!/usr/bin/env bash
# ==============================================================================
# Linux / macOS / WSL Setup Script for Bird Sound Identification System
# Run: chmod +x setup_linux.sh && ./setup_linux.sh
# ==============================================================================

set -e

echo -e "\033[36m==========================================================\033[0m"
echo -e "\033[36mSetting up AI Bird Sound Identification System (Linux/macOS)\033[0m"
echo -e "\033[36m==========================================================\033[0m"

# 1. Determine Python 3.10 / 3.11 executable
PYTHON_CMD="python3"
if command -v python3.10 &>/dev/null; then
    PYTHON_CMD="python3.10"
elif command -v python3.11 &>/dev/null; then
    PYTHON_CMD="python3.11"
fi
echo -e "\033[32m[✓] Using Python: $($PYTHON_CMD --version)\033[0m"

# 2. Setup Virtual Environment
echo -e "\n\033[33m[1/4] Setting up Python virtual environment in backend/venv...\033[0m"
if [ ! -d "backend/venv" ]; then
    $PYTHON_CMD -m venv backend/venv
    echo -e "\033[32m[✓] Virtual environment created.\033[0m"
else
    echo -e "\033[90m[i] backend/venv already exists.\033[0m"
fi

# 3. Create required directories
mkdir -p backend/tmp_uploads test_audio data database

# 4. Copy .env templates
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "\033[35m[!] Created backend/.env. Remember to add your Supabase keys!\033[0m"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "\033[35m[!] Created frontend/.env. Remember to add your Supabase anon key!\033[0m"
fi

# 5. Install backend dependencies if requirements.txt exists
if [ -f "backend/requirements.txt" ]; then
    echo -e "\n\033[33m[2/4] Installing backend dependencies...\033[0m"
    backend/venv/bin/python -m pip install --upgrade pip
    backend/venv/bin/python -m pip install -r backend/requirements.txt
    echo -e "\033[32m[✓] Backend dependencies installed.\033[0m"
fi

# 6. Install frontend dependencies if package.json exists
if [ -f "frontend/package.json" ]; then
    echo -e "\n\033[33m[3/4] Installing frontend dependencies...\033[0m"
    cd frontend && npm install && cd ..
    echo -e "\033[32m[✓] Frontend dependencies installed.\033[0m"
fi

echo -e "\n\033[36m==========================================================\033[0m"
echo -e "\033[32mSetup Completed Successfully!\033[0m"
echo -e "Next steps:"
echo -e "1. Edit backend/.env with your Supabase credentials."
echo -e "2. Edit frontend/.env with your Supabase anon key."
echo -e "3. Start backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo -e "4. Start frontend: cd frontend && npm run dev"
echo -e "\033[36m==========================================================\033[0m"
