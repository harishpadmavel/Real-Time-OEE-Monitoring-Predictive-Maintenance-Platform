# Real-Time OEE Monitoring & Predictive Maintenance Platform


A full-stack, industrial-grade MERN + Socket.IO platform for monitoring Overall Equipment Effectiveness (OEE) and predicting machine breakdowns across an automotive parts manufacturing line.

---

## ⚡ Quick Start (One-Click)

Simply double-click **`start.bat`** in the project root:
- Checks & starts local MongoDB
- Launches Express + Socket.IO Backend on `http://localhost:5001`
- Launches React + Vite Frontend on `http://localhost:5173`
- Opens your browser directly to the Forgepoint Control Room dashboard!

Alternatively, start from terminal:
```bash
# Terminal 1 - Backend
cd 03-backend-code
node server.js

# Terminal 2 - Frontend
cd frontend
npm.cmd run dev
```

---

## 📁 Repository Structure

### 1. `frontend/` (React + Vite)
Production-ready web application with industrial control room theme (`#14171A` dark mode, hazard stripes, semi-circular SVG OEE gauges, animated conveyor track):
- **Dashboard:** Line-wide OEE, 5 station cards (CNC, Press, Welding, Assembly, Painting), live downtime tickets, and predictive alerts.
- **Machines:** Asset register with ideal cycle times and live status controls.
- **Downtime Log:** Interactive downtime logging modal, Pareto loss distribution breakdown, and resolve action.
- **Predictive Alerts:** Explainable rolling 7-day breakdown frequency velocity tracking and actionable maintenance recommendations.
- **OEE Reports:** Multi-line 7-day trend chart with factor toggles (OEE, Availability, Performance, Quality) and TPM benchmark matrix.
- **Users & Roles:** Role permissions matrix and user register.
- **Settings:** Low-OEE threshold slider, alert toggles, and live Shop Floor Telemetry Simulator controls.
- **My Profile:** User account details and 1-click role switcher (Operator, Supervisor, Maintenance, Manager, Admin) to showcase dynamic role-based access control.

### 2. `03-backend-code/` (Node.js + Express + MongoDB + Socket.IO)
- **Port:** `5001`
- **Database:** MongoDB (`mongodb://127.0.0.1:27017/oee_platform`)
- **Key Modules:**
  - `utils/calculateOEE.js`: Availability × Performance × Quality calculation & benchmark classification
  - `controllers/oeeController.js`: Live OEE scoring, predictive alerts, 7-day trends
  - `controllers/downtimeController.js`: Downtime events, duration tracking, Pareto aggregation
  - `simulator/telemetrySimulator.js`: Realistic 3-second shop-floor telemetry engine
  - `seed/seedData.js`: Populates 5 physical machines, 5 demo user logins, sample downtime logs, and 7-day historical production records.

### 3. `02-dashboard-design/`
Original standalone static HTML mockup prototype for reference.

---

## 👥 Demo Logins

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Operator** | `operator@oee.local` | `oper123` | Assigned station(s) only — log downtime, update status |
| **Supervisor** | `supervisor@oee.local` | `super123` | All machines on Line-A, acknowledge alerts |
| **Maintenance** | `maintenance@oee.local` | `maint123` | Machine health history, predictive alerts, log repairs |
| **Plant Manager** | `manager@oee.local` | `manager123` | All lines/shifts, reports, trend charts |
| **Admin** | `admin@oee.local` | `admin123` | Full access — manage users, machines, simulator |

---

## 🧩 Tech Stack

- **Frontend:** React 19, Vite, Socket.IO Client, Vanilla CSS Design System
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, bcryptjs
- **Architecture:** Real-Time IoT Event-Driven Architecture (EDA)
