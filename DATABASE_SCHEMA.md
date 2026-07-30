# Database Schema: NeuroPredict Smart Stroke Management

NeuroPredict utilizes MongoDB as its primary datastore (via Mongoose schemas) with a transparent local JSON file fallback (`fallback_db.json`) for zero-configuration testing.

---

## 1. `users` Collection
Stores profile credentials and roles for clinicians (doctors), patients, and administrators.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `username` | String | Login username (unique) |
| `password` | String | Hashed password (Bcrypt) |
| `name` | String | Full name |
| `email` | String | Email address (clinicians only) |
| `phone` | String | 10-digit mobile contact number |
| `age` | Number | Age |
| `gender` | String | `Male` \| `Female` \| `Other` |
| `dob` | String | Date of birth (YYYY-MM-DD) |
| `address` | String | Office/Home address details |
| `role` | String | Portal permission role (`admin` \| `doctor` \| `patient`) |
| `doctor_id` | String | Clinician identification serial (e.g. `Doc1002`) |
| `patient_id` | String | Patient identification serial (e.g. `Pid00001`) |
| `createdAt` | Date | Timestamp of record creation |
| `updatedAt` | Date | Timestamp of last modification |

---

## 2. `patients` Collection
Stores demographic information and ward locations for clinical subjects.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Patient ID serial (unique index) |
| `name` | String | Full Name |
| `age` | Number | Age |
| `gender` | String | `Male` \| `Female` |
| `date_of_birth` | String | Date of birth (YYYY-MM-DD) |
| `phone` | String | Contact phone number |
| `address` | String | Physical ward location or home address |
| `doctor_id` | String | Assigned clinician's `doctor_id` |
| `created_at` | String | Date formatted timestamp |

---

## 3. `patientscores` Collection
Stores NIHSS assessment sub-scores, vitals, comorbidities, and calculated stroke risk scores.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Linked subject ID |
| `assessment_date`| String | Date of stratification assessment (YYYY-MM-DD) |
| `clinician_id` | String | Assessing doctor ID |
| `submission_timestamp` | String | Timestamp of assessment entry |
| `nihss` | Number | Total computed NIHSS score |
| `mrs` | Number | Pre-stroke mRS functional score (0-5) |
| `total_score` | Number | Total calculated score (matches NIHSS) |
| **Computed Risks** | | |
| `iscore` | Number | iScore points (30-day mortality index) |
| `soar` | Number | SOAR score (in-hospital mortality index) |
| `spiii` | Number | SPI-II score (2-year recurrence index) |
| `a2ds2` | Number | A2DS2 score (stroke pneumonia index) |
| `hat` | Number | HAT score (hemorrhage after tPA index) |
| `select_score` | Number | SeLECT score (post-stroke epilepsy index) |
| `sedan` | Number | SEDAN score (sICH risk index) |
| `esrs` | Number | ESRS score (Essen stroke recurrence index) |
| **Imaging & Lab Vitals** | | |
| `stroke_type` | String | `Ischemic` \| `Hemorrhagic` |
| `oxfordshire` | String | Oxfordshire classification (`LACI` \| `PACI` \| `POCI` \| `TACI`) |
| `toast` | String | TOAST etiology class |
| `early_infarct` | Number | Early infarct signs on CT (`0` or `1`) |
| `dense_mca` | Number | Dense MCA sign on CT (`0` or `1`) |
| `cortical_involvement`| Number | Cortical tissue involvement (`0` or `1`) |
| `mca_territory` | Number | MCA territory involvement (`0` or `1`) |
| `glucose_value` | Number | Random blood glucose (mg/dL) |
| `dysphagia` | Number | Swallow test dysphagia (`0` or `1`) |
| `af` | Number | Atrial Fibrillation history (`0` or `1`) |
| `chf` | Number | Congestive Heart Failure history (`0` or `1`) |
| `diabetes` | Number | Diabetes history (`0` or `1`) |
| `hypertension` | Number | Hypertension history (`0` or `1`) |
| `prior_stroke` | Number | Prior Stroke/TIA history (`0` or `1`) |
| `smoking` | Number | Current or history of smoking (`0` or `1`) |
| **NIHSS Items** | | |
| `loc` | Number | Level of Consciousness (0-3) |
| `loc_questions` | Number | LOC Questions (0-2) |
| `loc_commands` | Number | LOC Commands (0-2) |
| `best_gaze` | Number | Best Gaze (0-2) |
| `visual_fields` | Number | Visual Fields (0-3) |
| `facial_palsy` | Number | Facial Palsy (0-3) |
| `motor_arm_l` | Number | Motor Arm Left (0-4) |
| `motor_arm_r` | Number | Motor Arm Right (0-4) |
| `motor_leg_l` | Number | Motor Leg Left (0-4) |
| `motor_leg_r` | Number | Motor Leg Right (0-4) |
| `limb_ataxia` | Number | Limb Ataxia (0-2) |
| `sensory` | Number | Sensory loss (0-2) |
| `language` | Number | Language/Aphasia (0-3) |
| `dysarthria` | Number | Dysarthria (0-2) |
| `extinction` | Number | Extinction/Neglect (0-2) |

---

## 4. `rehabs` Collection
Stores assigned rehabilitation activities and therapy logs.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Subject ID |
| `activity_name` | String | Title of exercise routine |
| `duration` | String | Duration duration string (e.g. `15 mins`) |
| `frequency` | String | Daily frequency string (e.g. `2 times`) |
| `timing` | String | Assigned timing session (`Morning` \| `Evening`) |
| `duration_days` | String | Routine duration in days (e.g. `30`) |
| `start_date` | String | Routine start date (YYYY-MM-DD) |
| `end_date` | String | Routine end date (YYYY-MM-DD) |
| `body_part` | String | Focused muscle group / focus area |
| `performance_notes` | String | Clinician instructions and guidelines |
| `reminders_enabled` | Boolean | True if push notifications enabled |
| `status` | String | Activity status (`pending` \| `Completed`) |
| `completed_dates` | Array[String]| List of completed dates (YYYY-MM-DD) |

---

## 5. `reports` Collection
Stores clinical reports, upload attachments, and scan results.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Subject ID |
| `title` | String | Scanned document name (e.g. `MRI Brain`) |
| `details` | String | Brief findings |
| `image_url` | String | Base64 encoded JPEG/PNG data URI |
| `created_at` | String | Timestamp of document upload |

---

## 6. `messages` Collection
Stores real-time chat histories between clinicians and patients.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Subject ID channel |
| `sender` | String | Sender ID (Clinician `doctor_id` or Patient `patient_id`) |
| `sender_name` | String | Full name of message sender |
| `message` | String | Text body |
| `timestamp` | String | Formatted time string |

---

## 7. `notifications` Collection
Stores alert logs and care notifications.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `patient_id` | String | Target subject ID |
| `title` | String | Notification header |
| `message` | String | Text body |
| `type` | String | Alert type tag |
| `status` | String | Reading status (`unread` \| `read`) |
| `created_at` | String | Formatted timestamp |
