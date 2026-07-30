const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/nuero_api/get_clinician_info.php?doctor_id=Did00001',
  method: 'GET'
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error('Error:', error));
req.end();
