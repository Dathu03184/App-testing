const { User } = require('./src/config/schemas');
const db = require('./src/config/db');
require('dotenv').config();

async function run() {
  await db.connectDB();
  const user = await User.findOne({ doctor_id: 'Did00001' });
  console.log("Clinician found without role constraint:", user);
  const userWithRole = await User.findOne({ doctor_id: 'Did00001', role: 'doctor' });
  console.log("Clinician found with role constraint:", userWithRole);
  process.exit(0);
}
run();
