const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '100'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'neuro'
  });
  const [rows] = await pool.query('DESCRIBE clinicians');
  console.log(rows);
  process.exit(0);
}
run();
