# 🌿 Smart Campus Carbon Footprint Monitoring & Prediction System

> An AI-powered carbon emission tracking platform for smart campuses.
> Monitor, predict, and reduce your campus carbon footprint with a
> **React** frontend · **Spring Boot** backend · **Flask ML** service ·
> **MySQL** database · **Grafana** dashboards — all in Docker Compose.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · React Router v6 · Recharts · Axios |
| Backend | Spring Boot 3 · Spring Security · JWT · Spring Data JPA · Lombok |
| ML Service | Python 3 · Flask · scikit-learn (Random Forest) · joblib |
| Database | MySQL 8.0 |
| Dashboards | Grafana 10.4 |
| Deployment | Docker · Docker Compose · Nginx |

---

## 📐 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       USER'S BROWSER                         │
│                                                              │
│   React App (3000)          Grafana Dashboards (3001)        │
│       │                            │                         │
└───────┼────────────────────────────┼─────────────────────────┘
        │  JWT-secured REST calls    │  read-only MySQL query
        ▼                            │
┌──────────────────────────── Docker: carbon-net ─────────────┐
│                                                              │
│  Spring Boot API (8080) ◄──── Flask ML (5000) ─ INTERNAL    │
│         │                     No public port!               │
│         ▼                                                    │
│   MySQL Database (3306) ◄─────────────────────── Grafana    │
│   INTERNAL ONLY                                              │
└──────────────────────────────────────────────────────────────┘
```

> 🔒 **Flask ML** and **MySQL** have **no public ports** — they are only reachable inside the Docker network.

---

## 🌐 Access URLs

| Service | URL | Credentials |
|---|---|---|
| 🖥️ **React App** | http://localhost:3000 | Login below |
| ⚙️ **Backend API** | http://localhost:8080/api | JWT Bearer Token |
| 📊 **Grafana** | http://localhost:3001 | `admin` / `GrafanaAdmin@2024` |

### Default Login Accounts
| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `Admin@2024` |
| **Student** | Register via the app | Your chosen password |

---

## 🚀 Quick Start (Docker — Recommended)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) · 4 GB RAM

```bash
# Start all 5 services (first build ~5 min)
docker-compose up -d --build

# Open in browser:
#   App      → http://localhost:3000
#   Grafana  → http://localhost:3001

# Stop
docker-compose down

# Full reset (wipes database)
docker-compose down -v && docker-compose up -d --build
```

### Useful Docker Commands
```bash
docker-compose ps                          # Check all container statuses
docker-compose logs -f carbon-backend      # Backend live logs
docker-compose logs -f carbon-ml           # ML service logs
docker-compose logs -f mysql               # Database logs

# Rebuild a single service after code changes
docker-compose up -d --build carbon-backend
docker-compose up -d --build carbon-frontend
```

---

## 💻 Local Development (Without Docker)

**Requirements:** Java 17+ · Node.js 18+ · Maven 3.8+ · MySQL 8.0 · Python 3.9+

```bash
# 1. Init database
mysql -u root -p < database/init.sql

# 2. Backend  (change DB host to localhost in application.properties first)
cd carbon-backend && mvn spring-boot:run

# 3. ML Service
cd carbon-ml && pip install -r requirements.txt && python app.py

# 4. Frontend
cd carbon-frontend && npm install && npm run dev
```

---

## 🗂 Project Structure

```
Carbon FootPrint/
├── docker-compose.yml              # Orchestrates all 5 services
├── database/
│   └── init.sql                    # Schema + seed data (categories + admin user)
│
├── carbon-backend/                 # Spring Boot 3 REST API
│   └── src/main/java/com/campus/carbon/
│       ├── CarbonApplication.java  # Entry point
│       ├── entity/                 # JPA table models
│       │   ├── User.java           # users table (ADMIN / STUDENT)
│       │   ├── EmissionCategory.java  # emission_categories
│       │   ├── EmissionRecord.java    # emission_records
│       │   └── Prediction.java        # predictions
│       ├── repository/             # Spring Data JPA (auto-SQL)
│       ├── dto/                    # API request/response shapes
│       ├── controller/             # HTTP endpoints
│       │   ├── AuthController.java       # /api/auth/**
│       │   ├── EmissionController.java   # /api/emissions/**
│       │   ├── PredictionController.java # /api/predictions/**
│       │   ├── DashboardController.java  # /api/dashboard/**
│       │   └── AdminController.java      # /api/admin/** (ADMIN only)
│       ├── service/                # Business logic
│       │   ├── AuthService.java          # Login, JWT, BCrypt
│       │   ├── EmissionService.java      # Records + flexible CSV parser
│       │   ├── PredictionService.java    # Calls Flask, stores results
│       │   ├── DashboardService.java     # Aggregation & trends
│       │   └── AdminService.java         # User management
│       ├── security/               # JWT filter + Spring Security config
│       └── config/                 # CORS, web config
│
├── carbon-frontend/                # React 18 SPA
│   └── src/
│       ├── App.jsx                 # Routes + ProtectedLayout + AdminRoute
│       ├── api/index.js            # All API service calls
│       ├── context/AuthContext.jsx # Global auth state (JWT, role, user)
│       ├── components/
│       │   ├── Sidebar.jsx         # Desktop left nav (role-aware)
│       │   ├── Topbar.jsx          # Top bar with Grafana button
│       │   └── BottomNav.jsx       # Mobile bottom tab bar
│       ├── pages/
│       │   ├── Login.jsx           # Login + Register
│       │   ├── Dashboard.jsx       # Admin: KPI cards + CO₂ chart
│       │   ├── Emissions.jsx       # Add records + flexible CSV upload
│       │   ├── Predictions.jsx     # Live ML status + forecast + history
│       │   └── UserManagement.jsx  # Admin: manage users
│       └── styles/index.css        # Dark theme + mobile responsive CSS
│
├── carbon-ml/                      # Flask ML microservice (INTERNAL)
│   ├── app.py                      # /health + /forecast endpoints
│   ├── train_model.py              # Trains & saves model.pkl
│   ├── generate_dataset.py         # Generates synthetic training data
│   └── requirements.txt
│
└── grafana/
    └── provisioning/
        ├── datasources/            # Auto-configures MySQL connection
        └── dashboards/             # Pre-built campus carbon dashboard
```

---

## 👥 User Roles

| Feature | ADMIN | STUDENT |
|---|---|---|
| View Dashboard & Charts | ✅ | ❌ |
| View All Emission Records | ✅ | ❌ |
| Add Emission Record | ✅ | ✅ |
| Upload CSV (any format) | ✅ | ✅ |
| Delete Records | ✅ | ❌ |
| ML Predictions & History | ✅ | ✅ |
| User Management | ✅ | ❌ |

**Register:** Login page → "Register" → username, email, password (gets Student role).  
**Create Admin:** Login as `admin` → 👥 User Management → select Role = Admin.

---

## 📡 API Reference

Base URL: `http://localhost:8080/api`  
All protected routes require: `Authorization: Bearer <JWT_TOKEN>`

### Authentication (Public)
| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `POST` | `/auth/login` | `{username, password}` | `{token, username, role}` |
| `POST` | `/auth/register` | `{username, email, password}` | `{token, username, role}` |

### Emissions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/emissions` | Admin | All records |
| `POST` | `/emissions` | Any | Add record `{categoryId, month, value}` |
| `DELETE` | `/emissions/{id}` | Admin | Delete record |
| `GET` | `/emissions/categories` | Any | List categories |
| `POST` | `/emissions/upload` | Any | **Flexible CSV upload** (see below) |

### ML Predictions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/predictions/health` | Any | ML status + model name + R² score |
| `GET` | `/predictions/forecast?month=2026-03` | Any | Run AI prediction |
| `GET` | `/predictions/history` | Any | All stored predictions |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Admin | Total CO₂, top category, monthly trend |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin | List all users |
| `POST` | `/admin/users` | Admin | Create user `{username, email, password, role}` |
| `DELETE` | `/admin/users/{id}` | Admin | Delete user |

---

## 📤 Flexible CSV Upload

The upload system **auto-detects** column types by looking at actual cell values (not header names). It works with standard emission CSVs and survey/research datasets alike.

| Cell Value Type | Detected As | Action |
|---|---|---|
| Number (`478`, `369.63`) | **Numeric column** | Stored as an EmissionRecord per row |
| Date (`2025-01`, `2025/01`) | **Date column** | Used as the `month` field |
| Text (`Vegetarian`, `Apartment`) | **Text column** | Ignored |

**Rules:**
- No date column? → Current month assigned to all rows automatically.
- Unknown category name? → Auto-created with `emission_factor = 1.0`.
- Column names are cleaned: `Energy_Usage_kWh_per_Month` → category **"Energy Usage"**.

**Accepted date formats:** `2025-01` · `2025/01` · `01/2025` · `2025-01-15`

**Example — Standard format:**
```csv
category_id,month,value
1,2026-01,14500
2,2026-01,320
```

**Example — Survey/research dataset (like `campus_sustainability_dataset.csv`):**
```csv
Clothing_Spend_per_Month,Food_Type,Energy_Usage_kWh_per_Month,Carbon_Emissions_kgCO2
1360,Non-Vegetarian,478,369.63
```
→ Creates 3 records per row (Clothing Spend, Energy Usage, Carbon Emissions). Food_Type ignored (text).

---

## 🤖 ML Predictions Page

- **Live pulse indicator** — auto-refreshes ML service health every 30 seconds
- **R² accuracy bar** — visual model accuracy display
- **Forecast** — pick any future month, click Run Prediction
- **Offline warning** — forecast button disabled if ML service is down
- **Card history** — all past predictions in a mobile-friendly card grid

---

## 📊 Grafana Dashboards

Login at **http://localhost:3001** → `admin / GrafanaAdmin@2024`  
Navigate to: **Dashboards → Smart Campus Carbon Tracker**

Panels included:
- Total CO₂ · Record Count · ML Prediction Count · Latest Predicted CO₂ *(stat cards)*
- Monthly CO₂ Trend *(time-series)*
- CO₂ by Category *(donut)*
- Prediction vs Actual *(overlay chart)*
- Top 10 Emission Months *(bar)*