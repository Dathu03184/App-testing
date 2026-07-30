const db = require('./src/config/db');
require('dotenv').config();

async function run() {
  await db.connectDB();
  const { User } = require('./src/config/schemas');
  const user = await User.findOne({ doctor_id: 'Did00001', role: 'doctor' });
  console.log("Clinician in DB:", user);
  process.exit(0);
}
run();
