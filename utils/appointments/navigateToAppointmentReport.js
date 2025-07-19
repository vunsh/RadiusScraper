const REPORT_URL = 'https://mathnasium-admin.appointy.com/reports/appointment-detailed';

async function navigateToAppointmentReport(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Navigating to Appointment Detailed Report page...' });
  await page.goto(REPORT_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('div[aria-label="Choose Locations"]', { timeout: 15000 });
  sendUpdate({ message: 'Arrived at Appointment Detailed Report page.' });
}

module.exports = { navigateToAppointmentReport };
