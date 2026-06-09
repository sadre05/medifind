# MediFind — Full Project Structure

```
medifind/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # App entry point
│   │   ├── config.py               # All env config
│   │   ├── api/
│   │   │   ├── auth.py             # Login/register routes
│   │   │   ├── users.py            # User routes
│   │   │   ├── shops.py            # Shop routes
│   │   │   ├── requests.py         # Medicine request routes
│   │   │   ├── prescriptions.py    # Prescription upload + OCR
│   │   │   └── websocket.py        # Real-time WS
│   │   ├── core/
│   │   │   ├── security.py         # JWT + password hashing
│   │   │   └── dependencies.py     # FastAPI deps (get_current_user etc.)
│   │   ├── db/
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   └── init_db.py          # Create tables
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── shop.py
│   │   │   ├── medicine_request.py
│   │   │   ├── request_notification.py
│   │   │   ├── prescription.py
│   │   │   └── order.py
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── shop.py
│   │   │   ├── request.py
│   │   │   └── prescription.py
│   │   ├── services/
│   │   │   ├── geo_service.py      # Haversine, find shops in radius
│   │   │   ├── notification_service.py  # Fan-out to shops
│   │   │   ├── ocr_service.py      # Prescription OCR
│   │   │   └── request_service.py  # Request lifecycle
│   │   └── utils/
│   │       ├── request_id.py       # Generate MF-XXXXX-XXXX codes
│   │       └── file_upload.py      # S3/local file handling
│   ├── alembic/                    # DB migrations
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── user-app/                   # React app for patients
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── main.jsx
│   │   │   ├── pages/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Dashboard.jsx   # Main search + notifications
│   │   │   │   └── RequestDetail.jsx
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── PrescriptionUpload.jsx
│   │   │   │   ├── MedicineSelector.jsx  # Edit OCR results
│   │   │   │   ├── NotificationCard.jsx
│   │   │   │   └── GPSBadge.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.js
│   │   │   │   ├── useGPS.js
│   │   │   │   └── useAuth.js
│   │   │   └── services/
│   │   │       └── api.js
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── shop-app/                   # React app for pharmacy owners
│       ├── src/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   ├── pages/
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   └── Dashboard.jsx   # Live requests + history
│       │   ├── components/
│       │   │   ├── RequestCard.jsx
│       │   │   ├── ResponseHistory.jsx
│       │   │   └── ShopStatusToggle.jsx
│       │   ├── hooks/
│       │   │   ├── useWebSocket.js
│       │   │   └── useAuth.js
│       │   └── services/
│       │       └── api.js
│       ├── index.html
│       └── package.json
│
└── docker-compose.yml              # Postgres + Redis + Backend + Frontend
```
