const mongoose = require('mongoose');
const { User, Patient } = require('./src/config/schemas');
require('dotenv').config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/neuropredict');
  const users = await User.find({});
  console.log("All Users:", users);
  process.exit(0);
}
run();
