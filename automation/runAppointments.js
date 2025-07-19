const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

const loginAppointments = require('./loginAppointments');
const { navigateToAppointmentReport } = require('../utils/appointments/navigateToAppointmentReport');
const { setCenterFilter } = require('../utils/appointments/setCenterFilter');
const { setDateFilter } = require('../utils/appointments/setDateFilter');
const { waitForReportReady } = require('../utils/appointments/waitForReportReady');
const { exportReport } = require('../utils/appointments/exportReport');
const { waitForDownloadAndCopyToSheet } = require('../utils/appointments/waitForDownloadAndCopyToSheet'); // Add import
const path = require('path');

puppeteer.use(StealthPlugin());

async function runAppointments({ emitter, jobId, ...options }) {
  const absDownloadDir = path.resolve(__dirname, '..', 'temp');
  let progress = 0;
  function sendUpdate(msg, prog) {
    const progressVal = typeof prog === 'number' ? prog : progress;
    if (emitter) emitter.emit('update', JSON.stringify({ jobId, ...msg, progress: progressVal }));
    console.log('[runAppointments]', { ...msg, progress: progressVal });
  }

  const browser = await puppeteer.launch({
    headless: false, 
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: absDownloadDir,
  });

  

  try {
    progress = 0;
    sendUpdate({ message: 'Logging in to Appointy portal...' }, progress);

    await loginAppointments(page, process.env.APPOINTYUSERNAME, process.env.APPOINTYPASSWORD, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });

    progress = 20;
    sendUpdate({ message: 'Appointy login complete. Navigating to Appointment Detailed Report...' }, progress);

    await navigateToAppointmentReport(page, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });

    progress = 40;
    sendUpdate({ message: 'Arrived at Appointment Detailed Report page.' }, progress);

    progress = 50;
    await setCenterFilter(page, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });
    sendUpdate({ message: 'Center filter set to "All Locations".' }, progress);

    progress = 60;
    await setDateFilter(page, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });
    sendUpdate({ message: 'Date filter set to "Today".' }, progress);

    progress = 70;
    await waitForReportReady(page, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });
    sendUpdate({ message: 'Report is ready for export.' }, progress);

    progress = 80;
    await exportReport(page, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });
    sendUpdate({ message: 'Export initiated.' }, progress);

    progress = 90;
    await waitForDownloadAndCopyToSheet(absDownloadDir, {
      emit: (event, data) => {
        sendUpdate(JSON.parse(data), progress);
      }
    });
    sendUpdate({ message: 'CSV data successfully pasted to Google Sheet.' }, progress);

    progress = 100;
    sendUpdate({ message: 'Appointments automation finished successfully.', done: true }, progress);
  } catch (err) {
    progress = 100;
    sendUpdate({ error: 'Appointments automation failed', details: err.message }, progress);
  } finally {
    await browser.close();
  }
}

module.exports = runAppointments;
