# NeuroPredict – Smart Stroke Management Web Application

NeuroPredict is a modern, responsive healthcare web application developed to coordinate and optimize stroke care management. It translates and enhances the design, risk calculations, and workflow of the existing iOS application into a unified web portal for clinicians and patients.

---

## 🚀 Key Modules & Features
1. **Clinician Portal**: Patient directory listing, search, and register new patients.
2. **Interactive NIHSS Calculator**: 15 step-by-step diagnostic steppers, imaging indicators, and comorbidity trackers.
3. **Stroke Stratification Engine**: Real-time evaluation of **10 clinical risk scores** on any parameter update:
   - **NIHSS** (Stroke Severity)
   - **mRS** (Functional Disability)
   - **iScore** (30-day Mortality / Poor Outcome)
   - **SOAR** (In-hospital Mortality Risk)
   - **SPI-II** (2-year Recurrence/Death)
   - **A2DS2** (Stroke-Associated Pneumonia)
   - **HAT** (Hemorrhage after tPA Thrombolysis)
   - **SeLECT** (Post-stroke Epilepsy)
   - **SEDAN** (Symptomatic ICH risk after tPA)
   - **ESRS** (Essen Stroke Recurrence Risk)
4. **Rehabilitation Scheduler**: Log daily exercise routines, check completed progress rings, and display recovery recommendations.
5. **Scanned Records Archive**: Upload diagnostic reports and lab results as Base64 image files with a timeline viewer.
6. **Real-Time Consult Chat**: Live doctor-patient instant messaging powered by WebSockets (Socket.io) with HTTP polling fallbacks.
7. **Report Exporter**: Generate, view, and download clinician-ready clinical assessment reports as PDF files.

---

## 🛠️ Technology Stack
- **Frontend**: React.js (Vite) + Recharts + Lucide Icons
- **Backend**: Node.js + Express + Socket.io + PDFKit
- **Database**: MongoDB (Mongoose schemas)
- **Zero-Config Database Fallback**: If a live MongoDB service is not connected, the server automatically boots using a local file-based JSON database manager (`backend/src/config/fallback_db.json`), making the app instantly runnable and testable out-of-the-box!

---

## 📦 Project Directory Structure
```
neuropredict-web/
├── package.json               # Root scripts for concurrent runs
├── DATABASE_SCHEMA.md         # Database collection & types doc
├── API_DOCUMENTATION.md       # API endpoints & request parameter details
├── backend/
│   ├── src/
│   │   ├── config/            # DB configuration & schemas (db.js, schemas.js)
│   │   ├── routes/            # REST API endpoints controllers (api.js)
│   │   ├── services/          # Risk calculator & PDF exporter
│   │   └── app.js             # Express & Websocket server booter
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/        # Navigation sidebar components
    │   ├── pages/             # Auth, Dashboard, Calculator, Rehab, Chat, Reports
    │   ├── styles/            # Vanilla CSS custom variables (theme, auth, portal)
    │   ├── utils/             # API clients & calculations helpers
    │   └── App.jsx            # Main app shell
    └── package.json
```

---

## 💻 Installation & Quickstart

Ensure you have [Node.js](https://nodejs.org/) installed.

### Step 1: Install Dependencies
Run the install command in the root folder. This installs the concurrent tasks runner and triggers folder-specific installations for both directories:
```bash
npm install && npm run install:all
```

### Step 2: Spin Up Development Servers
Launch both the backend and frontend dev servers concurrently with a single command:
```bash
npm run dev
```

* **Frontend dev URL**: [http://localhost:5173](http://localhost:5173)
* **Backend API URL**: [http://localhost:5000/nuero_api](http://localhost:5000/nuero_api)

---

## 🔐 Pre-Populated Test Credentials

The local fallback database is pre-configured with active sample accounts for immediate testing. Enter the following IDs on the login screens (Password is **`password`** for both):

* **Clinician Portal**: Doctor ID: **`Doc001`** (Username is `doctor`)
* **Patient Portal**: Patient ID: **`Pid00001`**

---

## 🔬 Manual Verification & Testing Steps
1. **Authentication**:
   - Navigate to `http://localhost:5173`. Select **Clinician Portal**, log in using Doctor ID `Doc001` and password `password`.
   - Log out, select **Patient Portal**, log in using Patient ID `Pid00001` and password `password`.
2. **Clinician Admission**:
   - Log back into the Clinician Portal, click **Admit Patient**, enter demographic details, and click **Submit**.
3. **Assessment Calculation**:
   - On the Clinician Dashboard, click the **Calculator icon** next to `Pid00001` (Martha Smith).
   - In the form, slide steppers, check comorbidities, and navigate to **Risks Dashboard** to inspect live computations. Click **Commit Score to Registry** to save.
4. **Rehab Tracking**:
   - Click the **Rehab icon** next to a patient, add an exercise routine, log out and log in as the patient (`Pid00001`).
   - Open the **Rehab Schedule** tab, expand the card, click **Done**, and verify the progress percentage updates.
5. **Real-Time Chat**:
   - Open a Clinician window and a Patient window concurrently. Navigate to **Chat** in both and send messages; verify they appear instantly without browser reloading.
6. **PDF Reports**:
   - In **Reports Registry** tab, click **Download PDF** on any logged date to verify clinical summary output.
