const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const login = require('./login');
const { navigateToStudentDetails } = require('../utils/checkIn/navigateToStudentDetails');
const { openAttendanceForm } = require('../utils/checkIn/openAttendanceForm');
const { fillAndSubmitAttendanceForm } = require('../utils/checkIn/fillAndSubmitAttendanceForm');
require('dotenv').config();

async function runCheckIn({ studentId, emitter, jobId }) {
  const options = new chrome.Options();
  options
    // .addArguments('--headless')
    .addArguments('--no-sandbox')
    .addArguments('--disable-dev-shm-usage')
    .addArguments('--disable-gpu');
  options.setUserPreferences({
    'download.default_directory': './temp',
    'download.prompt_for_download': false,
    'download.directory_upgrade': true,
    'safebrowsing.enabled': true
  });

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  function sendUpdate(msg, progress) {
    if (emitter) emitter.emit('update', JSON.stringify({ jobId, ...msg, progress }));
    console.log('[runCheckIn]', { ...msg, progress });
  }

  try {
    sendUpdate({ message: 'Welcome! Starting your check-in...' }, 0);
    await login(driver, process.env.RADIUSUSERNAME, process.env.PASSWORD, emitter);

    sendUpdate({ message: 'Verifying your account...' }, 20);

    const validStudent = await navigateToStudentDetails(driver, studentId, emitter);
    if (!validStudent) {
      sendUpdate({ error: 'Invalid Student ID. Please check and try again.' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Preparing your check-in...' }, 30);

    const attendanceReady = await openAttendanceForm(driver, emitter);
    if (!attendanceReady) {
      sendUpdate({ error: 'Unable to open attendance form' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Filling out attendance form...' }, 55);

    const attendanceSubmitted = await fillAndSubmitAttendanceForm(driver, emitter);
    if (!attendanceSubmitted) {
      sendUpdate({ error: 'Unable to submit attendance form' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Checking you in now. Please wait...' }, 80);

    await new Promise(r => setTimeout(r, 1000));

    sendUpdate({ message: 'You have been successfully checked in! Have a great session!', done: true }, 100);
  } catch (err) {
    sendUpdate({ error: 'Unable to complete your check-in', details: err.message }, 100);
  } finally {
    await driver.quit();
  }
}

module.exports = runCheckIn;
