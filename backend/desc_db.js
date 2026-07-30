const db = require('./src/config/db');
require('dotenv').config();

async function run() {
  await db.connectDB();
  const pool = db.getPool();
  if (pool) {
    const [rows] = await pool.query('DESCRIBE clinicians');
    console.log(rows);
  }
  process.exit(0);
}
run();
