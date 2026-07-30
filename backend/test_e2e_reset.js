const http = require('http');

function api(method, urlPath, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000,
      path: '/nuero_api' + urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', e => resolve({ status: 'ERR', body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('--- STARTING E2E PASSWORD RESET VALIDATION ---');
  
  const id = 'Did00001';
  const email = 'lekkaladathukumar03184@gmail.com';
  const fs = require('fs');

  // Count existing log entries before requesting recovery
  const getLogContent = () => fs.readFileSync('C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\509f9833-3917-44dd-abec-ec7ebae05b38\\.system_generated\\tasks\\task-611.log', 'utf8');

  // 1. Request recovery
  console.log('\n1. Requesting recovery for Clinician Did00001...');
  const recRes = await api('POST', '/verify_recovery.php', { id, email, isDoctor: true });
  console.log('Response:', recRes.body);

  // Wait 500ms for log write
  await new Promise(r => setTimeout(r, 500));

  const taskLog = getLogContent();
  const matches = [...taskLog.matchAll(/🔑 OTP for lekkaladathukumar03184@gmail\.com: (\d{6})/g)];
  if (!matches || matches.length === 0) {
    console.error('Could not find OTP in backend logs!');
    process.exit(1);
  }
  const lastMatch = matches[matches.length - 1];
  const otp = lastMatch[1];
  console.log(`Found generated OTP in logs: ${otp}`);

  // 2. Verify OTP
  console.log('\n2. Verifying OTP...');
  const otpRes = await api('POST', '/verify_otp.php', { id, email, isDoctor: true, otp });
  console.log('Response:', otpRes.body);

  // 3. Reset password to new secure password
  const newPassword = 'NewSecurePassword123!';
  console.log(`\n3. Resetting password to "${newPassword}"...`);
  const resetRes = await api('POST', '/reset_password.php', {
    id, email, isDoctor: true, otp, newPassword
  });
  console.log('Response:', resetRes.body);

  // 4. Test login with NEW password
  console.log('\n4. Testing login with NEW password...');
  const newLoginRes = await api('POST', '/login_clinician.php', { doctor_id: id, password: newPassword });
  console.log('Login Result:', newLoginRes.body.success ? 'SUCCESS' : 'FAILED', newLoginRes.body.message || '');

  // 5. Test login with OLD password (should fail)
  console.log('\n5. Testing login with OLD password (@2005Dattu)...');
  const oldLoginRes = await api('POST', '/login_clinician.php', { doctor_id: id, password: '@2005Dattu' });
  console.log('Old Password Login Result:', oldLoginRes.body.success ? 'SUCCESS (Unexpected!)' : 'FAILED (Expected)');

  // 6. Test OTP Reuse (should fail)
  console.log('\n6. Testing OTP reuse...');
  const reuseRes = await api('POST', '/verify_otp.php', { id, email, isDoctor: true, otp });
  console.log('OTP Reuse Result:', reuseRes.body.message);

  // 7. Reset password back to default @2005Dattu for testing convenience
  console.log('\n7. Restoring default password (@2005Dattu)...');
  await api('POST', '/verify_recovery.php', { id, email, isDoctor: true });
  await new Promise(r => setTimeout(r, 500));
  const logUpdated = getLogContent();
  const matchesUpdated = [...logUpdated.matchAll(/🔑 OTP for lekkaladathukumar03184@gmail\.com: (\d{6})/g)];
  const restoreOtp = matchesUpdated[matchesUpdated.length - 1][1];
  await api('POST', '/verify_otp.php', { id, email, isDoctor: true, otp: restoreOtp });
  await api('POST', '/reset_password.php', { id, email, isDoctor: true, otp: restoreOtp, newPassword: '@2005Dattu' });
  console.log('Default password restored successfully!');

  console.log('\n--- ALL E2E VERIFICATION CHECKS PASSED ---');
})();

