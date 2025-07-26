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
    .addArguments('--headless')
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

  let currentProgress = 0;
  
  function sendUpdate(msg, progress) {
    if (progress !== undefined) currentProgress = progress;
    if (emitter) emitter.emit('update', JSON.stringify({ jobId, ...msg, progress: currentProgress }));
    console.log('[runCheckIn]', { ...msg, progress: currentProgress });
  }

  function incrementProgress(amount = 1) {
    currentProgress = Math.min(currentProgress + amount, 100);
    sendUpdate({}, currentProgress);
  }

  try {
    sendUpdate({ message: 'Welcome! Starting your check-in...' }, 0);
    incrementProgress(2);
    
    await login(driver, process.env.RADIUSUSERNAME, process.env.PASSWORD, sendUpdate, incrementProgress);
    incrementProgress(15);

    sendUpdate({ message: 'Verifying your account...' });
    incrementProgress(3);

    const validStudent = await navigateToStudentDetails(driver, studentId, sendUpdate, incrementProgress);
    if (!validStudent) {
      sendUpdate({ error: 'Check-in failed. Please verify your Student ID or contact support if you believe this is an error.' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Preparing your check-in...' });
    incrementProgress(5);

    const attendanceReady = await openAttendanceForm(driver, sendUpdate, incrementProgress);
    if (!attendanceReady) {
      sendUpdate({ error: 'Unable to open attendance form' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Filling out attendance form...' });
    incrementProgress(5);

    const attendanceSubmitted = await fillAndSubmitAttendanceForm(driver, sendUpdate, incrementProgress);
    if (!attendanceSubmitted) {
      sendUpdate({ error: 'Unable to submit attendance form' }, 100);
      await driver.quit();
      return;
    }

    sendUpdate({ message: 'Checking you in now. Please wait...' });
    incrementProgress(10);

    await new Promise(r => setTimeout(r, 1000));
    incrementProgress(10);

    sendUpdate({ message: 'You have been successfully checked in! Have a great session!', done: true }, 100);
  } catch (err) {
    sendUpdate({ error: 'Unable to complete your check-in', details: err.message }, 100);
  } finally {
    await driver.quit();
  }
}

module.exports = runCheckIn;
