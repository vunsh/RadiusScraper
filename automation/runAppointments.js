const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const loginAppointments = require('./loginAppointments');
require('dotenv').config();

async function runAppointments({ emitter, jobId, ...options }) {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(
      new chrome.Options()
        // .addArguments('--headless') off for testing
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments('--disable-gpu')
    )
    .build();

  function sendUpdate(msg, progress) {
    if (emitter) emitter.emit('update', JSON.stringify({ jobId, ...msg, progress }));
    console.log('[runAppointments]', { ...msg, progress });
  }

  try {
    let progress = 0;
    sendUpdate({ message: 'Logging in to Appointy portal...' }, progress);

    await loginAppointments(
      driver,
      process.env.APPOINTYUSERNAME,
      process.env.APPOINTYPASSWORD,
      emitter
    );

    progress = 20;
    sendUpdate({ message: 'Appointy login complete. Ready for further automation steps.' }, progress);


    progress = 100;
    sendUpdate({ message: 'Appointments automation finished successfully.', done: true }, progress);
  } catch (err) {
    sendUpdate({ error: 'Appointments automation failed', details: err.message }, 100);
  } finally {
    await driver.quit();
  }
}

module.exports = runAppointments;
