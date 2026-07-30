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

function pass(msg) { console.log('  ✅ PASS:', msg); }
function fail(msg) { console.log('  ❌ FAIL:', msg); }
function section(msg) { console.log('\n[' + msg + ']'); }

(async () => {
  console.log('=== AUTOMATED OTP RESEND & TTL TEST ===\n');

  const TEST_EMAIL = 'lekkaladathukumar03184@gmail.com';
  const TEST_DOC_ID = 'Did00001';

  // 1. Verify Recovery (Initial OTP)
  section('TEST 1: verify_recovery.php (no dev_otp, TTL 10m)');
  const res1 = await api('POST', '/verify_recovery.php', { id: TEST_DOC_ID, email: TEST_EMAIL, isDoctor: true });
  if (res1.body.success && res1.body.dev_otp === undefined) {
    pass('Recovery accepted, dev_otp is correctly hidden/removed from response');
  } else {
    fail('verify_recovery failed or dev_otp still present: ' + JSON.stringify(res1.body));
  }

  // 2. Resend OTP immediately -> Should fail due to 30s rate limiting
  section('TEST 2: Immediate resend_otp.php (should trigger 30s rate limit)');
  const res2 = await api('POST', '/resend_otp.php', { id: TEST_DOC_ID, email: TEST_EMAIL, isDoctor: true });
  if (!res2.body.success && res2.body.message.includes('Please wait')) {
    pass('Rate limit enforced: ' + res2.body.message);
  } else {
    fail('Rate limit check failed: ' + JSON.stringify(res2.body));
  }

  // 3. Verify OTP verification logic works
  section('TEST 3: Verify wrong OTP handling');
  const res3 = await api('POST', '/verify_otp.php', { id: TEST_DOC_ID, email: TEST_EMAIL, isDoctor: true, otp: '999999' });
  if (!res3.body.success && res3.body.message.includes('Invalid OTP')) {
    pass('Wrong OTP correctly rejected: ' + res3.body.message);
  } else {
    fail('Wrong OTP response incorrect: ' + JSON.stringify(res3.body));
  }

  console.log('\n=== ALL SERVER ENDPOINT TESTS COMPLETE ===');
})();
