# AI-Based Bird Sound Identification and Species Information System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![AI Engine](https://img.shields.io/badge/AI%20Model-Cornell%20BirdNET-green.svg)](https://birdnet.cornell.edu/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%20%2B%20RLS-3ECF8E.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Academic%20Project-orange.svg)]()

A full-stack, bioacoustic avian identification and species information system engineered for ornithological monitoring, biodiversity tracking, and academic demonstration. The system accepts field audio recordings via file upload or in-browser microphone capture, converts raw audio into Mel-frequency spectrograms, executes local convolutional neural network inference using the Cornell BirdNET model, and securely manages multi-tenant sighting histories and analytics through Supabase PostgreSQL and Private Cloud Storage.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Key Features](#key-features)
3. [Project Directory Layout](#project-directory-layout)
4. [Prerequisites & System Requirements](#prerequisites--system-requirements)
5. [Installation & Setup](#installation--setup)
   - [Windows Setup (PowerShell)](#windows-setup-powershell)
   - [Linux / macOS / WSL Setup (Bash)](#linux--macos--wsl-setup-bash)
   - [Supabase Database & Cloud Storage Setup](#supabase-database--cloud-storage-setup)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Running the Application](#running-the-application)
8. [API Reference](#api-reference)
9. [Running Automated Tests](#running-automated-tests)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Architecture

The following diagram illustrates the end-to-end data processing lifecycle from user audio ingestion to model classification, spectrogram synthesis, and cloud persistence:

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite)"]
        UI[User Interface & Dashboard]
        MIC[HTML5 MediaRecorder API]
        UPL[Drag-and-Drop Audio Uploader]
        AUTH[Supabase Auth Client]
    end

    subgraph Backend ["Backend Layer (FastAPI + Python 3.10)"]
        API[FastAPI Gateway]
        AUTH_DEP[JWT Authentication & User Validation]
        AUDIO_SVC[Librosa Audio Processing Engine]
        SPEC_GEN[Mel-Spectrogram Synthesizer]
        BIRDNET[Cornell BirdNET Model (TFLite / XNNPACK CPU)]
        INFO_SVC[Species Taxonomy & Info Matcher]
    end

    subgraph Storage ["Cloud Infrastructure (Supabase)"]
        POSTGRES[(PostgreSQL Database + RLS)]
        S_BUCKET[(Private Storage Bucket: bird-audio)]
        S_AUTH[Supabase Auth Service]
    end

    MIC -->|WAV / WebM Stream| UI
    UPL -->|WAV, MP3, OGG, FLAC| UI
    UI -->|JWT Bearer Token| AUTH_DEP
    UI -->|Multipart Audio Upload| API

    API --> AUTH_DEP
    AUTH_DEP -.->|Validate JWT| S_AUTH
    API --> AUDIO_SVC
    AUDIO_SVC --> SPEC_GEN
    AUDIO_SVC --> BIRDNET
    BIRDNET -->|Top-5 Species & Probabilities| INFO_SVC

    API -->|Upload Audio Binary| S_BUCKET
    S_BUCKET -->|Generate Signed URL (1-hr)| API
    API -->|Insert Record| POSTGRES
    INFO_SVC -->|Query Catalog| POSTGRES

    API -->|Identification JSON + Spectrogram Data URI| UI
```

---

## Key Features

- **Genuine Bioacoustic AI Classification:**
  - Integrates the official Cornell Lab of Ornithology **BirdNET** deep neural network locally.
  - Zero mock data or simulated responses; genuine inference on genuine audio files.
  - Generates top-5 candidate rankings with percentage confidence scores.
- **Dynamic Mel-Spectrogram Generation:**
  - Real-time Short-Time Fourier Transform (STFT) computed using **Librosa** and **Matplotlib**.
  - Maps acoustic energy across frequency (Hz) and time (seconds) on the Mel scale, converted directly to base64 PNG data URIs.
- **Audio Ingestion Flexibility:**
  - Live in-browser microphone recording with real-time waveform pulse timer, duration tracker, and preview playback.
  - Drag-and-drop file uploader supporting `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`, and `.webm` up to 25 MB.
- **Curated Species Information Catalog:**
  - Comprehensive reference database containing 30 species, prominently highlighting Indian avifauna (Indian Peafowl, Asian Koel, House Crow, Common Myna, Rose-ringed Parakeet, etc.).
  - Rich metadata: Common Name, Scientific Name, Family, Order, Habitat, Diet, Distribution, Conservation Status, verified Wikimedia Commons photography, and fascinating ecological facts.
- **Multi-Tenant Security & Row-Level Security (RLS):**
  - Supabase JWT authentication supporting modern asymmetric ECDSA (`ES256`) and symmetric (`HS256`) tokens.
  - PostgreSQL Row-Level Security policies guaranteeing strict tenant isolation: users can only view, query, and delete their own recording records.
  - Private Supabase Cloud Storage bucket (`bird-audio`) accessible exclusively via expiring time-limited HMAC signed URLs.
- **Interactive Analytics Dashboard:**
  - Visual analytics powered by **Recharts**:
    - KPI Metric Cards: Total Recordings, Successful Identifications, Most Frequent Species, Average Confidence, and Distinct Species.
    - Species Identification Frequency Horizontal Bar Chart.
    - Temporal Sighting Activity Area Chart.
    - Model Confidence Range Distribution Donut/Bar Chart.
- **Comprehensive History Management:**
  - Paginated table of past field records with search filtering and direct signed audio playback.
  - Deletion cascades: deleting a record securely purges the database entry and deletes the audio binary from private cloud storage.

---

## Project Directory Layout

```text
d:\birds\
├── backend\                    # FastAPI Application Root
│   ├── app\
│   │   ├── models\             # Domain models
│   │   ├── routes\             # Modular API endpoints
│   │   │   ├── birds.py        # Species catalog and taxonomy lookup
│   │   │   ├── health.py       # Health checks and dependency readiness
│   │   │   ├── history.py      # User recording history and deletion
│   │   │   ├── identify.py     # Main audio identification pipeline
│   │   │   └── statistics.py   # Dashboard aggregation metrics
│   │   ├── schemas\            # Pydantic request/response schemas
│   │   ├── services\           # Core business and AI logic
│   │   │   ├── audio_service.py     # Librosa spectrogram & metadata
│   │   │   ├── bird_info_service.py # Database species matching
│   │   │   ├── birdnet_service.py   # BirdNET model singleton & inference
│   │   │   └── storage_service.py   # Supabase Storage & signed URLs
│   │   ├── utils\              # General helper functions
│   │   ├── auth.py             # Supabase JWT token validator
│   │   ├── config.py           # Settings & environment configuration
│   │   ├── database.py         # Supabase client singleton
│   │   └── main.py             # FastAPI entrypoint & middleware
│   ├── tests\                  # Pytest automated test suite
│   ├── tmp_uploads\            # Secure temporary upload staging
│   ├── .env.example            # Backend environment template
│   ├── requirements.txt        # Python pip dependencies
│   └── run.py                  # Uvicorn development runner
├── frontend\                   # React 18 + Vite Application Root
│   ├── src\
│   │   ├── components\         # Reusable UI components
│   │   │   ├── AnalysisProgress.jsx      # Multi-step progress indicator
│   │   │   ├── AudioRecorder.jsx         # Live microphone capture
│   │   │   ├── AudioUploader.jsx         # Drag-and-drop file upload
│   │   │   ├── Footer.jsx                # Global footer
│   │   │   ├── IdentificationResult.jsx  # Rich result & spectrogram card
│   │   │   ├── Navbar.jsx                # Navigation bar with user badge
│   │   │   └── ProtectedRoute.jsx        # Auth protection wrapper
│   │   ├── context\            # Global state (AuthContext.jsx)
│   │   ├── pages\              # Application routes
│   │   │   ├── About.jsx       # MCA project documentation & viva notes
│   │   │   ├── BirdLibrary.jsx # 30-species catalog with search/filter
│   │   │   ├── Dashboard.jsx   # Analytics charts and KPI cards
│   │   │   ├── History.jsx     # Recording log with inline playback
│   │   │   ├── Home.jsx        # Landing page with feature showcases
│   │   │   ├── Identify.jsx    # Core audio upload/record page
│   │   │   └── Login.jsx       # Supabase Auth sign-in & sign-up
│   │   ├── services\           # API and Supabase client bindings
│   │   ├── test\               # Vitest component unit tests
│   │   ├── App.jsx             # React router configuration
│   │   ├── index.css           # Custom nature-inspired design system
│   │   └── main.jsx            # React root mount
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.js          # Vite build & proxy settings
├── data\
│   └── birds.json              # 30 Curated bird species profiles
├── database\
│   ├── 01_schema.sql           # Tables, foreign keys, and indexes
│   ├── 02_rls_policies.sql     # Row-Level Security tenant isolation
│   ├── 03_storage.sql          # Private bird-audio bucket policies
│   ├── seed_birds.py           # Database seeder script
│   └── verify_connection.py    # Supabase connectivity diagnostics
├── test_audio\                 # Genuine audio samples for testing
│   ├── asian_koel.wav          # Eudynamys scolopaceus (Asian Koel)
│   ├── indian_peafowl.wav      # Pavo cristatus (Indian Peafowl)
│   └── oriental_magpie_robin.wav # Copsychus saularis
├── README.md                   # System documentation (This file)
├── VIVA_GUIDE.md               # MCA Viva examination Q&A guide
├── setup_windows.ps1           # Automated Windows setup script
└── setup_linux.sh              # Automated Linux/macOS setup script
```

---

## Prerequisites & System Requirements

- **Operating System:** Windows 10/11, Ubuntu 20.04/22.04 LTS, or macOS 12+
- **Python:** Python 3.10 or 3.11 (64-bit)
- **Node.js:** Node.js v18.0.0 or higher, with `npm` v9+
- **Supabase Account:** Free-tier account at [supabase.com](https://supabase.com/)
- **Hardware:**
  - Minimum 4 GB RAM (8 GB recommended for audio processing and spectrogram generation).
  - 2 GB free disk space.

---

## Installation & Setup

### Windows Setup (PowerShell)

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd d:\birds
   ```

2. Run the automated Windows setup script:
   ```powershell
   .\setup_windows.ps1
   ```

   *Note regarding low C: drive disk space:* If your Windows system drive (`C:`) has limited space, pip cache can be directed to `D:` drive prior to dependency installation:
   ```powershell
   $env:TEMP = "D:\pip_tmp"; $env:TMP = "D:\pip_tmp"
   d:\birds\backend\venv\Scripts\python -m pip install -r backend\requirements.txt --cache-dir D:\pip_cache
   ```

### Linux / macOS / WSL Setup (Bash)

1. Open a terminal and navigate to the project directory:
   ```bash
   cd /path/to/birds
   ```

2. Make the script executable and run:
   ```bash
   chmod +x setup_linux.sh
   ./setup_linux.sh
   ```

---

### Supabase Database & Cloud Storage Setup

1. **Create a Supabase Project:**
   - Log in to [Supabase](https://supabase.com/) and click **New Project**.
   - Note down your **Project URL**, **Anon Public Key**, and **Service Role Key** from *Project Settings -> API*.

2. **Execute Database Migrations:**
   - In your Supabase Dashboard, open the **SQL Editor** on the left menu.
   - Run the contents of [database/01_schema.sql](file:///d:/birds/database/01_schema.sql) (creates tables `profiles`, `birds`, `identifications` and signup trigger).
   - Run the contents of [database/02_rls_policies.sql](file:///d:/birds/database/02_rls_policies.sql) (enforces Row-Level Security).
   - Run the contents of [database/03_storage.sql](file:///d:/birds/database/03_storage.sql) (creates private `bird-audio` storage bucket and security policies).

3. **Seed Species Catalog (30 Species):**
   - Populate `backend/.env` with your Supabase credentials (see below).
   - Run the Python seeding script:
     ```powershell
     d:\birds\backend\venv\Scripts\python database\seed_birds.py
     ```
   - All 30 curated bird species will be idempotently upserted into the `birds` table.

4. **Verify Live Connection:**
   ```powershell
   d:\birds\backend\venv\Scripts\python database\verify_connection.py
   ```

---

## Environment Variables Configuration

### Backend (`backend/.env`)

Create a file named `.env` inside `backend/` (do not commit this file):

```env
# Supabase Cloud Project Configuration
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
SUPABASE_STORAGE_BUCKET=bird-audio

# BirdNET Bioacoustic Model Settings
BIRD_CONFIDENCE_THRESHOLD=0.50

# Upload Constraints
MAX_UPLOAD_MB=25

# CORS Policy
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)

Create a file named `.env` inside `frontend/`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_BASE_URL=http://localhost:8000
```

> **Security Rule:** Never put the `SUPABASE_SERVICE_ROLE_KEY` inside `frontend/.env`. The service role key bypasses Row-Level Security and must remain exclusively on the FastAPI backend.

---

## Running the Application

### 1. Start the FastAPI Backend

In a PowerShell terminal:
```powershell
cd d:\birds\backend
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Swagger API Docs will be available at: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 2. Start the Vite React Frontend

In a second terminal:
```powershell
cd d:\birds\frontend
npm run dev
```
- Web Application will be available at: `http://localhost:5173`

---

## API Reference

All protected endpoints require an `Authorization: Bearer <JWT>` header obtained via Supabase Auth.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | System health check, BirdNET model status, Supabase DB readiness |
| `POST` | `/api/identify` | **Yes** | Multipart upload (`file`). Executes BirdNET inference, Mel-spectrogram generation, storage upload, and record insertion |
| `GET` | `/api/birds` | No | Returns all cataloged species sorted by common name |
| `GET` | `/api/birds/{scientific_name}` | No | Returns detailed species profile by scientific name |
| `GET` | `/api/history` | **Yes** | Returns paginated list of user's past identifications with fresh signed URLs |
| `GET` | `/api/history/{id}` | **Yes** | Returns single identification details by UUID |
| `DELETE` | `/api/history/{id}` | **Yes** | Deletes identification from database and purges audio binary from storage |
| `GET` | `/api/statistics` | **Yes** | Returns user-level metrics (totals, average confidence, distribution, timeline) |

---

## Running Automated Tests

### Backend Unit & Integration Tests (Pytest)

The test suite validates BirdNET inference, Librosa audio processing, species matching, and API endpoints:
```powershell
cd d:\birds\backend
.\venv\Scripts\python -m pytest
```

### Frontend Unit & Component Tests (Vitest)

The frontend test suite validates audio file format rules, size limitations, and authentication forms:
```powershell
cd d:\birds\frontend
npm test -- --run
```

### End-to-End System Integration Test

Runs a complete simulated session: authentication -> BirdNET classification -> Spectrogram creation -> Storage upload -> History lookup -> Dashboard calculation -> Record deletion:
```powershell
d:\birds\backend\venv\Scripts\python scratch\test_e2e_flow.py
```

---

## Troubleshooting Guide

### 1. `OSError: [Errno 28] No space left on device` during `pip install`
- **Cause:** Windows user temporary directory on `C:` drive is out of free storage.
- **Solution:** Direct `TEMP` and `TMP` to `D:` drive:
  ```powershell
  $env:TEMP = "D:\pip_tmp"; $env:TMP = "D:\pip_tmp"
  d:\birds\backend\venv\Scripts\python -m pip install -r backend\requirements.txt --cache-dir D:\pip_cache
  ```

### 2. Microphone Recording Access Denied
- **Cause:** Web browser blocks microphone access without explicit user permission.
- **Solution:** Click the lock or settings icon next to the address bar (`http://localhost:5173`) and change Microphone permissions to **Allow**. Ensure your computer has an active audio input device.

### 3. Supabase Token Authentication Error (401 Unauthorized)
- **Cause:** Modern Supabase projects use asymmetric `ES256` tokens rather than legacy symmetric `HS256` tokens.
- **Solution:** The AvianAI backend automatically validates tokens through `client.auth.get_user(token)`. Ensure your `backend/.env` has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Audio Playback Fails on History or Results Page
- **Cause:** Supabase Storage bucket `bird-audio` is private and signed URL expired.
- **Solution:** The frontend fetches fresh signed URLs with 1-hour expiration whenever history is retrieved. Check that `03_storage.sql` has been executed in your Supabase SQL Editor.
