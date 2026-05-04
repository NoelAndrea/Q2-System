# Q2 Planting Decision Tool — Digital Twin System

A full-stack maize crop simulation platform built with **React + Vite** (frontend) and **Node.js + Express + MySQL** (backend). Farmers enter field parameters and receive an instant predicted yield using the digital twin simulation engine.

---

## Features

### Farmer (role: `farmer`)
- Run yield simulations with 6 configurable parameters
- Multi-fertilizer combo support (blended factor logic)
- View personal simulation history with a **yield trend chart**
- **Export history to CSV** with one click
- Manage profile — update display name and change password

### Admin (role: `admin`)
- Admin Oversight Panel with live stats (users, simulations, avg yield, top soil type)
- Manage all users — create, suspend/activate, delete
- View **all simulations system-wide** with user attribution
- Filter simulation history by all users or own account
- Export any history view to CSV
- Audit log — login attempts, admin actions, simulation runs

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend    | Node.js, Express, JWT auth        |
| Database   | MySQL (MariaDB compatible)        |
| Security   | Helmet, bcryptjs, express-rate-limit, express-validator |

---

## Project Structure

```
q2_system_v3/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # All UI components (single-file SPA)
│   │   ├── api.js           # All backend HTTP calls
│   │   ├── App.css
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/
    ├── server.js            # Express entry point
    ├── .env                 # Environment config (edit before running)
    ├── src/
    │   ├── config/
    │   │   ├── database.js  # MySQL pool
    │   │   └── initDB.js    # Table creation + seed data
    │   ├── engine/
    │   │   └── simulationEngine.js  # Core yield calculation logic
    │   ├── middleware/
    │   │   ├── auth.js      # JWT authentication
    │   │   ├── validate.js  # express-validator rules
    │   │   └── audit.js     # Audit log writer
    │   └── routes/
    │       ├── auth.js      # /api/auth/*
    │       ├── simulations.js  # /api/simulate/*
    │       └── admin.js     # /api/admin/*
    └── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL 8+ (or MariaDB 10.5+)

---

### 1. Database

Create the database in MySQL:

```sql
CREATE DATABASE digital_twin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> The app auto-creates all tables and seeds demo data on first startup. No SQL import needed.

---

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env` (already present — update credentials):

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=digital_twin

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Start the backend:

```bash
npm start
# or for development with auto-restart:
npm run dev
```

On first run you'll see:
```
✅  All database tables ready (digital_twin)
🌱  Seeded reference data (crop, soil_type, crop_variety, fertilizer)
🌱  Seeded demo users:
    farmer@demo.com / farmer123  (farmer)
    admin@demo.com  / admin123   (admin)
🚀  Server running on http://localhost:5000
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> If your backend runs on a different port, set `VITE_API_URL` in `frontend/.env`:
> ```
> VITE_API_URL=http://localhost:5000
> ```

---

## Demo Accounts

| Role   | Email              | Password    |
|--------|--------------------|-------------|
| Farmer | farmer@demo.com    | farmer123   |
| Admin  | admin@demo.com     | admin123    |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint                   | Auth     | Description              |
|--------|----------------------------|----------|--------------------------|
| POST   | `/register`                | Public   | Create farmer account    |
| POST   | `/login`                   | Public   | Login, returns JWT token |
| GET    | `/me`                      | JWT      | Get current user info    |
| PUT    | `/profile`                 | JWT      | Update display name      |
| PUT    | `/profile/password`        | JWT      | Change password          |

### Simulations — `/api/simulate`

| Method | Endpoint  | Auth | Description                        |
|--------|-----------|------|------------------------------------|
| POST   | `/`       | JWT  | Run simulation and save result     |
| GET    | `/my`     | JWT  | Paginated own simulation history   |
| GET    | `/:id`    | JWT  | Single simulation result           |
| DELETE | `/:id`    | JWT  | Delete own simulation              |

**POST `/api/simulate` body:**
```json
{
  "plantingDate": "2025-01-15",
  "rainfall": 45.5,
  "soilType": "loam",
  "maizeVariety": "hybrid",
  "fertilizerType": ["npk", "urea"],
  "landSize": 2.5
}
```

### Admin — `/api/admin` (admin role required)

| Method | Endpoint                     | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/stats`                     | Overview statistics          |
| GET    | `/users`                     | All users                    |
| POST   | `/users`                     | Create user                  |
| PATCH  | `/users/:id/toggle`          | Suspend / activate user      |
| DELETE | `/users/:id`                 | Delete user                  |
| GET    | `/simulations`               | All simulations (paginated)  |
| GET    | `/logs`                      | Audit log entries            |

---

## Simulation Engine

Based on the Q2 System Design Document (Sections 7.1–7.7):

### Growth Stage Model
| Days Since Planting | Stage        |
|---------------------|--------------|
| 0–7                 | Germination  |
| 8–30                | Vegetative   |
| 31–60               | Flowering    |
| 61+                 | Maturity     |

### Yield Formula
```
yieldPerUnit = baseYield(100) × rainfallFactor × soilFactor × fertilizerFactor × varietyFactor × stageWeight
predictedYield = yieldPerUnit × landSize (ha)
```

### Factor Reference

| Input           | Value            | Factor |
|----------------|------------------|--------|
| Rainfall        | < 20 mm (Poor)   | 0.5    |
| Rainfall        | 20–50 mm (Normal)| 0.8    |
| Rainfall        | > 50 mm (Good)   | 1.0    |
| Soil            | Sandy            | 0.4    |
| Soil            | Clay             | 0.7    |
| Soil            | Loam             | 1.0    |
| Fertilizer      | No Fertilizer    | 0.3    |
| Fertilizer      | Organic          | 0.8    |
| Fertilizer      | Urea             | 0.95   |
| Fertilizer      | NPK              | 1.0    |
| Fertilizer combo| NPK + Urea       | +0.03 synergy bonus |
| Variety         | Local            | 0.9    |
| Variety         | Hybrid           | 1.1    |

---

## Security Features

- JWT authentication with 7-day expiry
- Bcrypt password hashing (cost factor 12)
- Global rate limiter: 100 req / 15 min
- Auth endpoint limiter: 20 req / 15 min
- Helmet security headers
- Input validation via express-validator
- Audit log for all security-relevant events
- User suspension (non-destructive account lock)

---

## Changelog

### v3 (current)
- ✅ Profile page — update display name
- ✅ Change password from profile page
- ✅ Yield trend chart in simulation history (Recharts)
- ✅ CSV export for simulation history
- ✅ `PUT /api/auth/profile` and `PUT /api/auth/profile/password` endpoints

### v2
- ✅ Multi-fertilizer combo selection with blended yield factor
- ✅ Admin "My Simulations" filter in history view
- ✅ Rainfall mm stored and shown in history tables
- ✅ Land size column in simulation result
- ✅ Full audit log system

### v1
- ✅ Core simulation engine (Sections 7.1–7.7)
- ✅ JWT auth (register / login / me)
- ✅ Farmer simulation history (paginated)
- ✅ Admin user management (create / toggle / delete)
- ✅ Admin stats overview

---

## License

Internal / Academic use — Q2 Digital Twin Prototype.
