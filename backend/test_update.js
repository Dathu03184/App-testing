const { User } = require('./src/config/schemas');
const db = require('./src/config/db');
require('dotenv').config();

async function run() {
  await db.connectDB();
  console.log("Connected to DB. isMySQL:", global.isMySQL);
  
  try {
    const updates = { age: null, dob: null, phone: '123' };
    const user = await User.findOneAndUpdate({ doctor_id: 'Did00001' }, updates);
    console.log("User found and updated:", user);
  } catch (err) {
    console.error("Test Error:", err);
  }
  process.exit(0);
}
run();
