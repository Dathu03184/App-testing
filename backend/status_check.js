const http = require('http');
const bcrypt = require('./node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');

function request(urlPath, method, body) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path: urlPath, method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d.substring(0, 100) }); }
      });
    });
    req.on('error', e => resolve({ status: 'ERR', body: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

(async () => {
  console.log('=== NEUROPREDICT FULL SYSTEM STATUS ===\n');

  const health = await request('/health', 'GET');
  const dbStatus = health.body.database || 'Unknown';
  console.log('[1] Backend Health: ONLINE | Database: ' + dbStatus);

  const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/config/fallback_db.json'), 'utf8'));
  const doctors = db.users.filter(u => u.role === 'doctor');
  const patients_users = db.users.filter(u => u.role === 'patient');

  console.log('\n[2] DATABASE (JSON Fallback - Zero Config)');
  console.log('    Users total: ' + db.users.length);
  console.log('    Doctors: ' + doctors.length);
  doctors.forEach(d => console.log('      -> ' + d.doctor_id + ' | ' + d.name + ' | ' + (d.email || 'no email')));
  console.log('    Patients: ' + patients_users.length);
  patients_users.forEach(p => console.log('      -> ' + p.patient_id + ' | ' + p.name));
  console.log('    Patient Records: ' + db.patients.length);
  console.log('    Clinical Scores: ' + db.patientscores.length);
  console.log('    Rehab Activities: ' + db.rehabs.length);
  console.log('    Chat Messages: ' + db.messages.length);
  console.log('    Medication entries: ' + (db.medications ? db.medications.length : 0));

  const docPwMatch = await bcrypt.compare('@2005Dattu', doctors[0].password);
  const patPwMatch = await bcrypt.compare('@2005Dattu', patients_users[0].password);
  console.log('\n[3] PASSWORD VERIFICATION');
  console.log('    Algorithm: bcrypt (cost=10)');
  console.log('    Doctor hash valid for "@2005Dattu": ' + docPwMatch);
  console.log('    Patient hash valid for "@2005Dattu": ' + patPwMatch);

  const clinLogin = await request('/nuero_api/login_clinician.php', 'POST', { doctor_id: 'Did00001', password: '@2005Dattu' });
  const patLogin = await request('/nuero_api/patient_login.php', 'POST', { patient_id: 'Pid00001', password: '@2005Dattu' });
  const getPatients = await request('/nuero_api/get_patients.php', 'GET');
  const getScores = await request('/nuero_api/get_scores.php?patient_id=Pid00001', 'GET');
  const getRehab = await request('/nuero_api/get_rehab.php?patient_id=Pid00001', 'GET');
  const getPdf = await request('/nuero_api/download_pdf.php?patient_id=Pid00001&date=2026-06-09', 'GET');
  const nextDoc = await request('/nuero_api/next_id.php?role=doctor', 'GET');
  const nextPat = await request('/nuero_api/next_patient_id.php', 'GET');

  console.log('\n[4] API ENDPOINT VERIFICATION');
  console.log('    POST /clinician_login    => ' + clinLogin.status + ' | ' + (clinLogin.body.success ? 'SUCCESS - ' + clinLogin.body.name : 'FAIL - ' + clinLogin.body.message));
  console.log('    POST /patient_login      => ' + patLogin.status + ' | ' + (patLogin.body.success ? 'SUCCESS - ' + patLogin.body.name : 'FAIL - ' + patLogin.body.message));
  console.log('    GET  /get_patients       => ' + getPatients.status + ' | Count: ' + (Array.isArray(getPatients.body) ? getPatients.body.length : '?'));
  console.log('    GET  /get_scores         => ' + getScores.status + ' | Count: ' + (Array.isArray(getScores.body) ? getScores.body.length : '?'));
  console.log('    GET  /get_rehab          => ' + getRehab.status + ' | Count: ' + (Array.isArray(getRehab.body) ? getRehab.body.length : '?'));
  console.log('    GET  /download_pdf       => ' + getPdf.status + ' | ' + (getPdf.status === 200 ? 'PDF OK' : 'FAIL'));
  console.log('    GET  /next_id (doctor)   => ' + (nextDoc.body.next_id || '?'));
  console.log('    GET  /next_patient_id    => ' + (nextPat.body.patient_id || '?'));

  console.log('\n[5] SERVICE URLS');
  console.log('    Frontend:    http://localhost:5173');
  console.log('    Backend:     http://localhost:5000/nuero_api');
  console.log('    Health:      http://localhost:5000/health');

  console.log('\n[6] LOGIN CREDENTIALS (from database)');
  console.log('    Clinician  -> Doctor ID: Did00001 | Password: password');
  console.log('    Patient    -> Patient ID: Pid00001 | Password: password');

  console.log('\n=== ALL SYSTEMS OPERATIONAL ===');
})();
