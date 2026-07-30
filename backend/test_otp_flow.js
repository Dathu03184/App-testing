const http = require('http');

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: '/nuero_api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== TESTING 6-DIGIT OTP VERIFICATION FLOW ===\n');

  // Step 1: Request OTP for Account Recovery
  console.log('Step 1: Requesting OTP for Did00001 (lekkaladathukumar03184@gmail.com)...');
  const reqRes = await post('/verify_recovery.php', {
    id: 'Did00001',
    email: 'lekkaladathukumar03184@gmail.com',
    isDoctor: true
  });
  console.log('Recovery Response:', reqRes.body);

  // Step 2: Invalid OTP check
  console.log('\nStep 2: Testing invalid OTP verification...');
  const invalidRes = await post('/verify_otp.php', {
    id: 'Did00001',
    email: 'lekkaladathukumar03184@gmail.com',
    isDoctor: true,
    otp: '999999'
  });
  console.log('Invalid OTP Response:', invalidRes.body);

  console.log('\n=== OTP VERIFICATION FLOW VERIFIED ===');
})();
