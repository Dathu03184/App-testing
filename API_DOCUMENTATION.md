# REST API & Socket.io Channel Documentation: NeuroPredict

This document details the REST APIs and real-time Socket.io triggers exposed by the Node.js backend. 

All endpoints are mounted under the base path `/nuero_api` (incorporating iOS client compatibility) and accept standard `application/json` payloads or standard form parameters.

---

## 1. Authentication Endpoints

### 1.1 `POST /nuero_api/register_clinician.php`
Registers a new clinician/doctor account.

**Request Body:**
```json
{
  "name": "Dr. John Doe",
  "email": "jdoe@cityhospital.com",
  "username": "johndoe",
  "age": 42,
  "gender": "Male",
  "dob": "1984-05-12",
  "address": "Cardiology, City Hospital",
  "phone": "9876543210",
  "doctor_id": "Doc1002",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Clinician registered successfully",
  "doctor_id": "Doc1002"
}
```

---

### 1.2 `POST /nuero_api/clinician_login.php` (or `/nuero_api/login_clinician.php`)
Authenticates a clinician profile and generates a JWT session token.

**Request Body:**
```json
{
  "doctor_id": "Doc1002",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "doctor_id": "Doc1002",
  "name": "Dr. John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

### 1.3 `POST /nuero_api/register_patient.php`
Registers a new patient subject.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "name": "Martha Smith",
  "age": 68,
  "gender": "Female",
  "date_of_birth": "1958-03-24",
  "phone": "9876543211",
  "address": "Room 402, ICU Ward",
  "password": "custompassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "patient": {
    "_id": "66487e...",
    "patient_id": "Pid00001",
    "name": "Martha Smith",
    "age": 68,
    "gender": "Female"
  }
}
```

---

### 1.4 `POST /nuero_api/patient_login.php`
Authenticates a patient profile.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "password": "custompassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "patient_id": "Pid00001",
  "name": "Martha Smith",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

## 2. Patient Management Endpoints

### 2.1 `GET /nuero_api/next_patient_id.php`
Returns the next incremented patient ID based on current database counts.

**Response:**
```json
{
  "success": true,
  "patient_id": "Pid00005"
}
```

---

### 2.2 `GET /nuero_api/get_patients.php`
Fetches a list of all patients.

**Response:**
```json
[
  {
    "patient_id": "Pid00001",
    "name": "Martha Smith",
    "age": 68,
    "gender": "Female",
    "address": "Room 402, ICU Ward"
  }
]
```

---

### 2.3 `GET /nuero_api/get_patient_info.php`
Fetches details of a specific patient.

**Query Parameters:**
- `patient_id` (e.g. `Pid00001`)

**Response:**
```json
{
  "success": true,
  "patient_id": "Pid00001",
  "name": "Martha Smith",
  "age": 68,
  "gender": "Female",
  "phone": "9876543211",
  "address": "Room 402, ICU Ward"
}
```

---

## 3. Assessments & Complications Risk

### 3.1 `POST /nuero_api/add_score.php`
Saves or updates a stroke risk stratification score record. Implements automatic calculations for iScore, SOAR, SPI-II, A2DS2, HAT, SeLECT, SEDAN, and ESRS on backend database commit.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "assessment_date": "2026-06-09",
  "clinician_id": "Doc1002",
  "mrs": 1,
  "stroke_type": "Ischemic",
  "oxfordshire": "TACI",
  "toast": "Cardioembolic",
  "glucose_value": 156,
  "early_infarct": 1,
  "dense_mca": 1,
  "cortical_involvement": 0,
  "mca_territory": 1,
  "dysphagia": 1,
  "af": 1,
  "chf": 0,
  "diabetes": 1,
  "hypertension": 1,
  "prior_stroke": 0,
  "smoking": 1,
  "loc": 1,
  "loc_questions": 1,
  "loc_commands": 0,
  "best_gaze": 1,
  "visual_fields": 2,
  "facial_palsy": 2,
  "motor_arm_l": 2,
  "motor_arm_r": 0,
  "motor_leg_l": 3,
  "motor_leg_r": 0,
  "limb_ataxia": 1,
  "sensory": 1,
  "language": 2,
  "dysarthria": 1,
  "extinction": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score submitted successfully"
}
```

---

### 3.2 `GET /nuero_api/get_scores.php`
Fetches the score history logs for a patient.

**Query Parameters:**
- `patient_id` (e.g. `Pid00001`)

**Response:**
```json
[
  {
    "patient_id": "Pid00001",
    "assessment_date": "2026-06-09",
    "nihss": 20,
    "iscore": 128,
    "soar": 5,
    "spiii": 8,
    "a2ds2": 8,
    "hat": 4,
    "select_score": 5,
    "sedan": 5,
    "esrs": 6
  }
]
```

---

## 4. Rehabilitation Schedule Endpoints

### 4.1 `POST /nuero_api/add_rehab.php`
Saves a new rehabilitation routine exercise task.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "activity_name": "Morning Walk",
  "duration": "15 mins",
  "frequency": "2 times",
  "timing": "Morning",
  "body_part": "Legs",
  "notes": "Walk around hallway with walker support.",
  "reminders_enabled": 1
}
```

---

### 4.2 `GET /nuero_api/get_rehab.php`
Returnsassigned rehab activity list.

**Query Parameters:**
- `patient_id`

**Response:**
```json
[
  {
    "id": "66487ab...",
    "patient_id": "Pid00001",
    "activity_name": "Morning Walk",
    "duration": "15 mins",
    "frequency": "2 times",
    "timing": "Morning",
    "body_part": "Legs",
    "performance_notes": "Walk around hallway with walker support.",
    "isCompleted": false,
    "statuses": []
  }
]
```

---

### 4.3 `POST /nuero_api/update_rehab_status.php`
Completes or updates daily rehabilitation status.

**Request Body:**
```json
{
  "rehab_id": "66487ab...",
  "status": "Completed"
}
```

---

### 4.4 `POST /nuero_api/delete_rehab.php`
Deletes a rehab routine item.

**Request Body:**
```json
{
  "rehab_id": "66487ab..."
}
```

---

## 5. Messaging & Real-Time Sync

### 5.1 `GET /nuero_api/messages.php`
Fetches chat log between patient and clinician.

**Query Parameters:**
- `patient_id`

---

### 5.2 `POST /nuero_api/messages.php`
Pushes message. Emits real-time event `new_message` to Socket.io channel `patient_<patient_id>`.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "sender": "Doc1002",
  "sender_name": "Dr. John Doe",
  "message": "Please make sure to do your hand grip squeeze exercises."
}
```

---

## 6. Reports & PDF Exports

### 6.1 `POST /nuero_api/upload_report.php`
Saves base64 scans.

**Request Body:**
```json
{
  "patient_id": "Pid00001",
  "title": "Brain MRI Scan",
  "details": "Infarction right MCA",
  "image": "iVBORw0KGgoAAAANSUhEUgAAADIA..."
}
```

---

### 6.2 `GET /nuero_api/download_pdf.php`
Renders and triggers download of assessment reports as PDF files.

**Query Parameters:**
- `patient_id`
- `date` (assessment date YYYY-MM-DD)

---

## 7. Socket.io WebSockets Channels

Socket.io connects on `http://localhost:5000`.

### 7.1 Socket Events

- **Client Emit: `join_patient` (patient_id)**
  Binds the client connection to the socket room `patient_<patient_id>` to stream chat logs and recovery updates in real-time.
  
- **Server Broadcast: `new_message` (newMessageObject)**
  Pushed to `patient_<patient_id>` when a chat participant submits a message.
  
- **Server Broadcast: `score_updated` ({ patient_id, assessment_date })**
  Triggered when a score is submitted or updated. Used to sync clinician-patient dashboard components.
  
- **Server Broadcast: `rehab_updated` ({ patient_id })**
  Triggered on rehab additions or status edits to trigger progress calculations redraw.
