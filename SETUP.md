# MediFind — Complete Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Tesseract OCR (for prescription scanning)

---

## Option A: Run with Docker (Recommended — fastest)

```bash
# 1. Clone / place the project
cd medifind

# 2. Start Postgres + Redis + Backend
docker-compose up -d

# 3. Install and run User frontend
cd frontend/user-app
npm install
npm run dev        # runs on http://localhost:5173

# 4. In a new terminal — install and run Shop frontend
cd frontend/shop-app
npm install
npm run dev        # runs on http://localhost:5174
```

Done. Open:
- http://localhost:5173  → Patient app
- http://localhost:5174  → Pharmacy app
- http://localhost:8000/docs  → API docs (Swagger)

---

## Option B: Run Locally (without Docker)

### Step 1 — PostgreSQL

```bash
# Mac
brew install postgresql@16 && brew services start postgresql@16

# Ubuntu
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE USER medifind WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE medifind_db OWNER medifind;"
```

### Step 2 — Tesseract OCR (for prescription scanning)

```bash
# Mac
brew install tesseract

# Ubuntu
sudo apt install tesseract-ocr

# Windows
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
```

### Step 3 — Backend setup

```bash
cd medifind/backend

# Copy env file
cp .env.example .env
# Edit .env — set your DATABASE_URL and SECRET_KEY

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server (tables auto-create on startup)
python run.py
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Step 4 — User Frontend

```bash
cd medifind/frontend/user-app
npm install
npm run dev
```
Opens at: http://localhost:5173

### Step 5 — Shop Frontend

```bash
cd medifind/frontend/shop-app
npm install
npm run dev
```
Opens at: http://localhost:5174

---

## Configuration

### backend/.env (minimum required changes)

```env
DATABASE_URL=postgresql+asyncpg://medifind:password@localhost:5432/medifind_db
SYNC_DATABASE_URL=postgresql://medifind:password@localhost:5432/medifind_db
SECRET_KEY=your-random-32-char-secret-key-here
```

### Frontend API URL
If your backend is not on localhost:8000, create `.env` files:

```bash
# frontend/user-app/.env
VITE_API_URL=http://your-backend-host:8000

# frontend/shop-app/.env
VITE_API_URL=http://your-backend-host:8000
```

---

## Testing the Full Flow

### 1. Register a pharmacy (shop app)
- Go to http://localhost:5174/register
- Fill in shop name, phone, password
- Click "Get GPS Location" or enter lat/lng manually
  - Tokyo test coords: lat=35.6762, lng=139.6503
- Submit → you'll be logged into the dashboard
- Toggle the shop to **Open**

### 2. Register a patient (user app)
- Go to http://localhost:5173/register
- Fill in name, phone, password
- Submit → logged into dashboard

### 3. Enable GPS (user app)
- Click "Enable GPS" in the header
- Allow location access in browser
  - For localhost testing: browser may block GPS — use Chrome → Settings → Site Settings → Location → allow localhost

### 4. Search for medicine
- Type "Paracetamol" and click Search
- OR click a quick chip
- A Request ID (MF-XXXXXX-XXXX) appears instantly

### 5. Watch shop dashboard
- The pharmacy dashboard instantly shows the new request (via WebSocket)
- Click "Confirm Stock" → user gets notified immediately

### 6. Test prescription upload
- On user app, click "Upload Prescription"
- Upload any image with medicine names written on it
- OCR extracts medicine names
- User sees a checklist — can tick/untick/edit each medicine
- Click "Search 3 Medicines" → fans out to shops

---

## OCR Options

### Free (default): Tesseract
Works out of the box after installing tesseract. Good for typed prescriptions.

### Better: OpenAI GPT-4 Vision
Edit `.env`:
```env
OCR_BACKEND=openai
OPENAI_API_KEY=sk-...
```
Better at handwritten prescriptions.

---

## Production Checklist

- [ ] Change `SECRET_KEY` to a random 64-char string
- [ ] Set `APP_ENV=production`
- [ ] Set `STORAGE_BACKEND=s3` and configure AWS credentials
- [ ] Set `is_verified=False` in `api/auth.py` → require admin to approve shops
- [ ] Add HTTPS (nginx + certbot)
- [ ] Set `REQUEST_EXPIRE_MINUTES` to a sensible value (default: 30)
- [ ] Add a cron job or Celery task to expire old requests

---

## API Endpoints Summary

| Method | Endpoint | Who | What |
|--------|----------|-----|------|
| POST | /api/auth/user/register | Public | Register patient |
| POST | /api/auth/user/login | Public | Patient login |
| POST | /api/auth/shop/register | Public | Register pharmacy |
| POST | /api/auth/shop/login | Public | Shop login |
| POST | /api/requests/ | User | Create medicine search |
| GET | /api/requests/{id}/responses | User | Get shop responses |
| GET | /api/requests/my/all | User | My request history |
| GET | /api/requests/shop/incoming | Shop | See pending requests |
| POST | /api/requests/shop/respond | Shop | Confirm/decline |
| GET | /api/requests/shop/history | Shop | Response history |
| POST | /api/prescriptions/upload | User | Upload + OCR prescription |
| PATCH | /api/shops/status | Shop | Toggle open/closed |
| PATCH | /api/shops/location | Shop | Update GPS |
| WS | /ws/user?token=... | User | Real-time notifications |
| WS | /ws/shop?token=... | Shop | Real-time requests |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| users | Patient accounts |
| shops | Pharmacy accounts + GPS |
| medicine_requests | Each search with unique request_code |
| request_notifications | Per-shop notification for each request |
| prescriptions | Uploaded prescription files + OCR results |
| orders | Created after user picks a shop |
