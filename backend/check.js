const mongoose = require('mongoose');
const { User, Patient } = require('./src/config/schemas');
require('dotenv').config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/neuropredict');
  const user = await User.findOne({ doctor_id: 'Did00001' });
  console.log("User:", user);
  process.exit(0);
}
run();
