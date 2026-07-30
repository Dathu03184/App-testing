const fs = require('fs');
const path = require('path');
require('dotenv').config();

// We will mock process.env if needed to connect to Mongo
const mongoose = require('mongoose');
const { User, Patient, PatientScores } = require('./src/config/schemas');

async function run() {
  // First try local JSON
  const fbPath = path.resolve(__dirname, 'src', 'config', 'fallback_db.json');
  if (fs.existsSync(fbPath)) {
    console.log("Fallback DB exists");
    const data = JSON.parse(fs.readFileSync(fbPath, 'utf8'));
    console.log("Fallback Patients:", data.patients.filter(p => p.patient_id === 'Pid00001'));
    console.log("Fallback Scores:", (data.patientscores || []).filter(s => s.patient_id === 'Pid00001'));
  }

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/neuropredict');
    console.log("Mongo connected!");
    const u = await User.findOne({ patient_id: 'Pid00001', role: 'patient' });
    console.log("Mongo User:", u ? u.name : null);
    const p = await Patient.findOne({ patient_id: 'Pid00001' });
    console.log("Mongo Patient:", p ? p.name : null);
    const s = await PatientScores.findOne({ patient_id: 'Pid00001', assessment_date: { $regex: '2026-05-10' } });
    console.log("Mongo Scores:", !!s);
    const s2 = await PatientScores.find({ patient_id: 'Pid00001' });
    console.log("Mongo All Scores Dates:", s2.map(x => x.assessment_date));
  } catch(e) {
    console.log("Mongo failed", e.message);
  }

  process.exit(0);
}
run();
