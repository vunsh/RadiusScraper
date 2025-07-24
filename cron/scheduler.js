const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

async function triggerAppointmentsJob() {
  console.log('[CRON] Triggering /api/appointments/run...');
  try {
    const res = await axios.post(
      'http://localhost:3000/api/appointments/run',
      { apiKey: process.env.API_KEY }
    );
    console.log('[CRON] Job response:', res.data);
  } catch (err) {
    console.error('[CRON] Failed to run job:', err.message);
  }
}

function startAppointmentsCron() {

  cron.schedule('0 9-16 * * *', async () => {
    await triggerAppointmentsJob();
  }, {
    timezone: 'America/Los_Angeles' 
  });
}

module.exports = { startAppointmentsCron };
