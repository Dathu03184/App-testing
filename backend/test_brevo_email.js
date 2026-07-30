const https = require('https');
require('dotenv').config({ path: './.env' });

console.log('--- BREVO EMAIL DELIVERY TEST ---');
console.log('API Key:', process.env.BREVO_API_KEY ? '***' + process.env.BREVO_API_KEY.slice(-8) : 'MISSING');
console.log('Sender:', process.env.SMTP_USER);
console.log('From Name:', process.env.SMTP_FROM_NAME);

const payload = JSON.stringify({
  sender: { name: process.env.SMTP_FROM_NAME || 'Neurologist', email: process.env.SMTP_USER },
  to: [{ email: process.env.SMTP_USER, name: 'Test User' }],
  subject: '🔐 Test OTP Email from Neurologist App',
  htmlContent: '<h2>Your test 6-digit OTP is: <span style="color:#039855;font-size:28px;letter-spacing:6px;">123456</span></h2><p>This is a test email sent via Brevo HTTPS API (port 443). If you received this, real OTP delivery is working!</p>'
});

const req = https.request({
  hostname: 'api.brevo.com',
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\nStatus Code:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('\n✅ EMAIL SENT SUCCESSFULLY! Check your Gmail inbox (also Spam/Promotions).');
    } else {
      console.log('\n❌ FAILED — Check the error message above.');
    }
  });
});

req.on('error', err => {
  console.error('❌ Network Error:', err.message);
});

req.write(payload);
req.end();
