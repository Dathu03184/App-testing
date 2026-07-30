const https = require('https');

console.log('--- TESTING HTTPS OUTBOUND PORT 443 CONNECTION ---');

// Test if standard HTTPS port 443 is working
const req = https.get('https://api.github.com', { headers: { 'User-Agent': 'NodeTest' } }, res => {
  console.log('✅ HTTPS Port 443 is OPEN! Status:', res.statusCode);
});
req.on('error', err => {
  console.error('❌ HTTPS Error:', err.message);
});
