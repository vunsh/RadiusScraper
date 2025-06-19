const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const login = require('./login');
const {
  navigateToPage,
  selectDate,
  selectDropdown,
  fillMultiSelect,
  clickSearchButton,
  waitForTableData,
  clickExportButton
} = require('../utils/automation');
const config = require('../constants/config.json');
const regions = require('../constants/regions.json');
const path = require('path');
const copyToGoogleSheet = require('../utils/copyToGoogleSheet');
require('dotenv').config();

async function runReport({ report, region, filter, emitter, jobId, downloadDir = './downloads', downloadFilename }) {
  const absDownloadDir = path.resolve(__dirname, '..', 'temp');
  const excelFileName = downloadFilename || (jobId ? `${jobId}.xlsx` : 'report.xlsx');
  const options = new chrome.Options();
  options
  .addArguments('--headless')
    .addArguments('--no-sandbox')
    .addArguments('--disable-dev-shm-usage')
    .addArguments('--disable-gpu'); 

options.addArguments('--disable-autofill-keyboard-accessory-view');
options.addArguments('--disable-autofill');
options.addArguments('--disable-save-password-bubble');
options.setUserPreferences({
    'download.default_directory': absDownloadDir,
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
    console.log('[runReport]', { ...msg, progress });
  }

  try {
    let progress = 0;
    sendUpdate({ message: 'Logging in to Radius portal...' }, progress);
    await login(driver, process.env.RADIUSUSERNAME, process.env.PASSWORD, emitter);

    progress = 10;
    if (report) {
      sendUpdate({ message: `Navigating to report page: ${report}` }, progress);
      await navigateToPage(driver, report);
    }

    let filters = Array.isArray(filter) ? [...filter] : [];
    if (region) {
      const centerElementId = "AllCenterListMultiSelect";
      const centers = Array.isArray(regions[region]?.centers) ? regions[region].centers : [];
      if (centers.length > 0) {
        filters = filters.filter(f => !(f.type === 'multi' && f.elementId === centerElementId));
        filters.push({
          type: 'multi',
          elementId: centerElementId,
          value: centers
        });
        progress = 20;
        sendUpdate({ message: `Region "${region}" detected. Filtering for centers: ${centers.join(', ')}` }, progress);
      }
    }

    if (Array.isArray(filters) && filters.length > 0) {
      let filterProgressStart = progress;
      let filterProgressEnd = 40;
      let filterStep = Math.floor((filterProgressEnd - filterProgressStart) / filters.length) || 1;
      for (let i = 0; i < filters.length; i++) {
        const f = filters[i];
        const { type, elementId, value } = f;
        progress = filterProgressStart + filterStep * (i + 1);
        sendUpdate({ message: `Applying filter of type "${type}" on element "${elementId}" with value: ${Array.isArray(value) ? value.join(', ') : value}` }, progress);
        if (type === 'date') {
          await selectDate(driver, elementId, value);
        } else if (type === 'dropdown') {
          await selectDropdown(driver, elementId, value);
        } else if (type === 'multi') {
          await fillMultiSelect(driver, elementId, value);
        }
      }
      progress = filterProgressEnd;
    } else {
      progress = 40;
      sendUpdate({ message: 'No filters to apply.' }, progress);
    }

    progress = 50;
    sendUpdate({ message: 'Clicking the "Search" button to generate the report...' }, progress);
    await clickSearchButton(driver);

    const reportName = Object.keys(config.reports).find(
      key => config.reports[key] === report
    );
    progress = 60;
    sendUpdate({ message: `Waiting for table data to load for report "${reportName}"...` }, progress);
    await waitForTableData(driver, reportName);

    progress = 70;
    sendUpdate({ message: 'Clicking "Export to Excel" to download the report file...' }, progress);
    await clickExportButton(driver);

    const fs = require('fs');
    const glob = require('glob');
    const waitForDownload = (dir, timeout = 60000) => {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          glob(path.join(dir, '*.xlsx'), (err, files) => {
            // Check for .crdownload files
            glob(path.join(dir, '*.crdownload'), (err2, downloading) => {
              if (files.length > 0 && downloading.length === 0) {
                return resolve(files[0]);
              }
              if (Date.now() - start > timeout) return reject(new Error('Download timed out'));
              setTimeout(check, 500);
            });
          });
        })();
      });
    };

    let downloadedFile;
    try {
      progress = 80;
      downloadedFile = await waitForDownload(absDownloadDir);
      sendUpdate({ message: `Downloaded file detected: ${path.basename(downloadedFile)}. Preparing for further processing...` }, progress);
      const targetPath = path.join(absDownloadDir, excelFileName);
      if (path.basename(downloadedFile) !== excelFileName) {
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
        fs.renameSync(downloadedFile, targetPath);
        sendUpdate({ message: `Excel file renamed to "${excelFileName}".` }, progress);
      } else {
        sendUpdate({ message: `Excel file already named "${excelFileName}"` }, progress);
      }

      const reportName = Object.keys(config.reports).find(
        key => config.reports[key] === report
      );
      if (region && reportName) {
        progress = 90;
        sendUpdate({ message: `Uploading data to Google Sheet for region "${region}", sheet "${reportName}"...` }, progress);
        try {
          await copyToGoogleSheet(region, reportName, targetPath);
          progress = 95;
          sendUpdate({ message: `Data successfully pasted to Google Sheet for region "${region}", sheet "${reportName}".` }, progress);
          try {
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
              progress = 98;
              sendUpdate({ message: `Temporary Excel file deleted: "${excelFileName}".` }, progress);
            }
          } catch (delErr) {
            sendUpdate({ error: 'Failed to delete temporary Excel file', details: delErr.message }, progress);
          }
        } catch (sheetErr) {
          sendUpdate({ error: 'Failed to copy data to Google Sheet', details: sheetErr.message }, progress);
        }
      }

    } catch (e) {
      sendUpdate({ error: 'Failed to detect or rename downloaded file', details: e.message }, progress);
    }

    progress = 100;
    sendUpdate({ message: 'All steps completed! Report automation finished successfully.', done: true }, progress);
  } catch (err) {
    sendUpdate({ error: 'Automation failed', details: err.message }, 100);
  } finally {
    await driver.quit();
  }
}

module.exports = runReport;
