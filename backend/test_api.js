const http = require('http');

const data = JSON.stringify({
  id: 'Did00001',
  role: 'doctor',
  updates: {
    name: 'Lekkala Dattu Kumar',
    email: 'lekkaladathukumar03184@gmail.com',
    phone: '9494813811',
    address: 'Ongole',
    dob: '2005-01-01',
    age: '22',
    gender: 'Male'
  }
});

const options = {
  hostname: 'localhost',
  port: 5000, // or 5001 whatever the backend is
  path: '/nuero_api/update_profile.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error('Error:', error));
req.write(data);
req.end();
