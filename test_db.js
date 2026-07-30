const mongoose = require('mongoose');
const { PatientScores } = require('./backend/src/config/schemas');

mongoose.connect('mongodb://127.0.0.1:27017/neuropredict', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    const scores = await PatientScores.find({ patient_id: 'Pid00001' });
    console.log(JSON.stringify(scores, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
