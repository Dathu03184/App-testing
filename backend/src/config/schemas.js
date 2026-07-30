const mongoose = require('mongoose');
const { getModel } = require('./db');
const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String },
  dob: { type: String },
  address: { type: String },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], default: 'doctor' },
  doctor_id: { type: String }, // ID for clinicians
  patient_id: { type: String },  // ID for patients
  reset_otp: { type: String },
  reset_otp_expiry: { type: Date }
}, { timestamps: true });

// Patient Schema
const PatientSchema = new Schema({
  patient_id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  username: { type: String },
  password: { type: String },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  doctor_id: { type: String }, // Assigned Doctor Clinician ID
  created_at: { type: String }
}, { timestamps: true });

// PatientScores Schema
const PatientScoresSchema = new Schema({
  patient_id: { type: String, required: true },
  assessment_date: { type: String, required: true },
  clinician_id: { type: String },
  submission_timestamp: { type: String },
  nihss: { type: Number },
  mrs: { type: Number },
  total_score: { type: Number },
  
  // Computed Scores
  iscore: { type: Number },
  soar: { type: Number },
  spiii: { type: Number },
  a2ds2: { type: Number },
  hat: { type: Number },
  select_score: { type: Number },
  sedan: { type: Number },
  esrs: { type: Number },

  // Clinical & Imaging inputs
  stroke_type: { type: String },
  oxfordshire: { type: String },
  toast: { type: String },
  early_infarct: { type: Number },
  dense_mca: { type: Number },
  cortical_involvement: { type: Number },
  mca_territory: { type: Number },
  glucose_value: { type: Number },
  dysphagia: { type: Number },
  af: { type: Number },
  chf: { type: Number },
  diabetes: { type: Number },
  hypertension: { type: Number },
  prior_stroke: { type: Number },
  smoking: { type: Number },

  // NIHSS Breakdown
  loc: { type: Number },
  loc_questions: { type: Number },
  loc_commands: { type: Number },
  best_gaze: { type: Number },
  visual_fields: { type: Number },
  facial_palsy: { type: Number },
  motor_arm_l: { type: Number },
  motor_arm_r: { type: Number },
  motor_leg_l: { type: Number },
  motor_leg_r: { type: Number },
  limb_ataxia: { type: Number },
  sensory: { type: Number },
  language: { type: Number },
  dysarthria: { type: Number },
  extinction: { type: Number }
}, { timestamps: true });

// Rehab Schema
const RehabSchema = new Schema({
  patient_id: { type: String, required: true },
  activity_name: { type: String, required: true },
  duration: { type: String },
  frequency: { type: String },
  timing: { type: String },
  duration_days: { type: String },
  start_date: { type: String },
  end_date: { type: String },
  body_part: { type: String },
  performance_notes: { type: String },
  reminders_enabled: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'Completed'], default: 'pending' },
  completed_dates: [{ type: String }] // Dates when rehab was finished
}, { timestamps: true });

// Report Schema
const ReportSchema = new Schema({
  patient_id: { type: String, required: true },
  title: { type: String, required: true },
  details: { type: String },
  image_url: { type: String }, // Base64 Data URI or filepath
  created_at: { type: String }
}, { timestamps: true });

// Message Schema
const MessageSchema = new Schema({
  patient_id: { type: String, required: true },
  sender: { type: String, required: true }, // Clinician doctor_id or Patient patient_id
  sender_name: { type: String },
  message: { type: String, required: true },
  timestamp: { type: String }
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new Schema({
  patient_id: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  created_at: { type: String }
}, { timestamps: true });

// Medication Schema
const MedicationSchema = new Schema({
  patient_id: { type: String, required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  timeOfDay: { type: String, required: true }, // e.g. "Morning", "Afternoon", "Evening"
  notes: { type: String },
  status: { type: String, enum: ['Active', 'Discontinued'], default: 'Active' },
  taken_dates: [{ type: String }] // Array of ISO date strings when medication was taken
}, { timestamps: true });

// Export Models
module.exports = {
  User: getModel('User', UserSchema),
  Patient: getModel('Patient', PatientSchema),
  PatientScores: getModel('PatientScores', PatientScoresSchema),
  Rehab: getModel('Rehab', RehabSchema),
  Report: getModel('Report', ReportSchema),
  Message: getModel('Message', MessageSchema),
  Notification: getModel('Notification', NotificationSchema),
  Medication: getModel('Medication', MedicationSchema)
};
