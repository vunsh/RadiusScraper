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
  // Set download directory to ./temp in project root
  const absDownloadDir = path.resolve(__dirname, '..', 'temp');
  // Use jobId for the Excel file name if not provided
  const excelFileName = downloadFilename || (jobId ? `${jobId}.xlsx` : 'report.xlsx');
  const options = new chrome.Options();
  options
//   .addArguments('--headless')
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

  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify({ jobId, ...msg }));
  }

  try {
    sendUpdate({ message: 'Logging in...' });
    await login(driver, process.env.RADIUSUSERNAME, process.env.PASSWORD);

    // Example: Use report and region to determine navigation
    if (report) {
      sendUpdate({ message: 'Navigating to report page...' });
      await navigateToPage(driver, report);
    }

    // Insert region centers into filters if region is provided
    let filters = Array.isArray(filter) ? [...filter] : [];
    if (region) {
      const centerElementId = "AllCenterListMultiSelect";
      // Updated: get centers array from regions[region].centers
      const centers = Array.isArray(regions[region]?.centers) ? regions[region].centers : [];
      if (centers.length > 0) {
        filters = filters.filter(f => !(f.type === 'multi' && f.elementId === centerElementId));
        filters.push({
          type: 'multi',
          elementId: centerElementId,
          value: centers
        });
      }
    }

    // Apply filters
    if (Array.isArray(filters)) {
      for (const f of filters) {
        const { type, elementId, value } = f;
        sendUpdate({ message: `Applying filter: ${type} (${elementId})` });
        if (type === 'date') {
          await selectDate(driver, elementId, value);
        } else if (type === 'dropdown') {
          await selectDropdown(driver, elementId, value);
        } else if (type === 'multi') {
          await fillMultiSelect(driver, elementId, value);
        }
      }
    }

    // --- New: Click search and wait for table data ---
    sendUpdate({ message: 'Clicking search button...' });
    await clickSearchButton(driver);

    // Find the report name from the URL for config lookup
    const reportName = Object.keys(config.reports).find(
      key => config.reports[key] === report
    );
    sendUpdate({ message: 'Waiting for table data to load...' });
    await waitForTableData(driver, reportName);

    sendUpdate({ message: 'Clicking export to Excel...' });
    await clickExportButton(driver);

    // Wait for the file to appear and rename it to excelFileName
    const fs = require('fs');
    const glob = require('glob');
    const waitForDownload = (dir, timeout = 20000) => {
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
      downloadedFile = await waitForDownload(absDownloadDir);
      sendUpdate({ message: `Downloaded file detected: ${path.basename(downloadedFile)}` });
      const targetPath = path.join(absDownloadDir, excelFileName);
      if (path.basename(downloadedFile) !== excelFileName) {
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
        fs.renameSync(downloadedFile, targetPath);
        sendUpdate({ message: `Excel file renamed to ${excelFileName}` });
      } else {
        sendUpdate({ message: `Excel file already named ${excelFileName}` });
      }

      // --- New: Copy to Google Sheet ---
      const reportName = Object.keys(config.reports).find(
        key => config.reports[key] === report
      );
      if (region && reportName) {
        sendUpdate({ message: `Uploading to Google Sheet for region ${region}, sheet "${reportName}"...` });
        try {
          await copyToGoogleSheet(region, reportName, targetPath);
          sendUpdate({ message: `Data pasted to Google Sheet for region ${region}, sheet "${reportName}"` });
        } catch (sheetErr) {
          sendUpdate({ error: 'Failed to copy data to Google Sheet', details: sheetErr.message });
        }
      }
      // --- End new logic ---

    } catch (e) {
      sendUpdate({ error: 'Failed to detect or rename downloaded file', details: e.message });
    }

    sendUpdate({ message: 'Report automation completed!', done: true });
  } catch (err) {
    sendUpdate({ error: 'Automation failed', details: err.message });
  } finally {
    // await driver.quit();
  }
}

module.exports = runReport;
