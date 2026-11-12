# FoodLink — Surplus to Share 🍲

**FoodLink (Surplus to Share)** connects restaurants, hotels, banquet halls, and canteens with surplus food to verified recipient NGOs and volunteers — cutting food waste and feeding local communities.

Everything needed to run this project — the **complete React frontend**, the **FastAPI backend**, and the **pre-seeded database** — is self-contained in this repository.

---

## 🚀 Quick Setup Guide for Your Friend's PC

Running this project on any computer takes just 2 simple steps:

### Step 1: Make sure Python & Node.js are installed
- **Node.js (LTS)**: Download & install from [nodejs.org](https://nodejs.org/)
- **Python (3.10+)**: Download & install from [python.org](https://www.python.org/)  
  *(⚠️ **Important**: On Windows, check the box that says **"Add python.exe to PATH"** during installation).*

---

### Step 2: One-Click Automated Setup & Launch

#### On Windows:
1. Double-click **`setup.bat`**  
   *(This automatically installs all Python backend and Node frontend dependencies).*
2. Double-click **`start.bat`**  
   *(This starts both the FastAPI backend on port 8001 and Vite frontend on port 3000, and opens http://localhost:3000 in the browser).*

#### On macOS / Linux:
```bash
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

---

## 👥 Demo Logins (Pre-configured)

You can switch personas with **1 click** using the top **Interactive Role HUD bar**, or sign in on the `/login` page:

| Role | Role Label | Email | Password |
| :--- | :--- | :--- | :--- |
| **Provider** | Food Donor (Chef Vikram) | `donor@foodlink.in` | `donor123` |
| **Recipient** | Recipient NGO (Sister Clara) | `ngo@foodlink.in` | `ngo123` |
| **Volunteer** | Rescue Courier (Rahul Sharma) | `volunteer@foodlink.in` | `volunteer123` |
| **Admin** | Operations Director | `admin@foodlink.in` | `admin123` |

---

## 💾 Where is the Database Stored?

The database is 100% local and requires **no external database server** (no PostgreSQL or MongoDB setup needed):
- Stored directly in `backend/data/db.json`
- Initialized from `backend/data/backup-full.json` (contains all pre-seeded accounts, banquet listings, NGO requests, and photo proofs)
- Any changes made while running the website (posting new surplus, claiming meals, accepting pickups, uploading proofs) are saved automatically to `backend/data/db.json` and persist across restarts.

---

## 🛠️ Manual Start (Optional)

If you prefer starting each service manually in terminal tabs:

### 1. Backend Server:
```bash
cd backend
pip install -r requirements.txt
python server.py
```
- API & Swagger Docs: **http://localhost:8001/api/docs**

### 2. Frontend App:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: **http://localhost:3000**

---

## 📂 Repository Structure

```
surplus-to-share/
├── backend/
│   ├── server.py              # FastAPI server (Auth, JWT, CRUD, Stats, Excel/JSON backup)
│   ├── requirements.txt       # Python dependencies
│   └── data/
│       ├── backup-full.json   # Full initial dataset (users, donations, requests, proofs)
│       └── db.json            # Active persistent database
├── frontend/
│   ├── src/
│   │   ├── components/        # UI widgets, layout, cards, dialogs, map
│   │   ├── pages/             # Home, Explore, Impact, Map, Dashboards, Login, Register
│   │   ├── hooks/             # Authentication & data query hooks
│   │   ├── lib/               # API layer, geo coords, formatters, utilities
│   │   ├── types/             # Complete TypeScript definitions
│   │   ├── App.tsx            # Main router & role authentication guards
│   │   └── main.tsx           # Entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── setup.bat                  # 1-Click setup script (Windows)
├── start.bat                  # 1-Click launcher script (Windows)
├── setup.sh                   # 1-Click setup script (macOS/Linux)
├── start.sh                   # 1-Click launcher script (macOS/Linux)
└── README.md
```
