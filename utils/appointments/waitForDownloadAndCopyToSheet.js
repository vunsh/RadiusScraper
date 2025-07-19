const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { google } = require('googleapis');
const config = require('../../constants/config.json');
const { parse } = require('csv-parse/sync');

function extractSpreadsheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../../google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function waitForDownload(dir, timeout = 60000 * 5) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      glob(path.join(dir, '*.csv'), (err, files) => {
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
}

async function loadCsvData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, { skip_empty_lines: true });
}

async function waitForDownloadAndCopyToSheet(absDownloadDir, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Waiting for CSV download...' });

  let downloadedFile;
  try {
    downloadedFile = await waitForDownload(absDownloadDir);
    sendUpdate({ message: `Downloaded file detected: ${path.basename(downloadedFile)}. Preparing for Google Sheet upload...` });
  } catch (e) {
    sendUpdate({ error: 'Failed to detect downloaded file', details: e.message });
    throw e;
  }

  // Parse CSV
  let data;
  try {
    data = await loadCsvData(downloadedFile);
    sendUpdate({ message: 'CSV file parsed successfully.' });
  } catch (e) {
    sendUpdate({ error: 'Failed to parse CSV file', details: e.message });
    throw e;
  }

  // Upload to Google Sheet (AppointySheet, sheet "Appointy")
  const appointySheetUrl = config.AppointySheet;
  const spreadsheetId = extractSpreadsheetId(appointySheetUrl);
  if (!spreadsheetId) throw new Error(`Invalid Google Sheet URL: ${appointySheetUrl}`);
  const sheets = await getSheetsClient();

  // Find the "Appointy" sheet in the AppointySheet spreadsheet
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const appointySheet = spreadsheet.data.sheets.find(
    s => s.properties.title.trim().toLowerCase() === 'appointy'
  );
  const appointySheetName = appointySheet ? appointySheet.properties.title : spreadsheet.data.sheets[0].properties.title;

  // Clear and resize the "Appointy" sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${appointySheetName}'`,
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: appointySheet.properties.sheetId,
              gridProperties: {
                rowCount: 1,
                columnCount: 1
              }
            },
            fields: 'gridProperties(rowCount,columnCount)'
          }
        }
      ]
    }
  });

  // Write data to the "Appointy" sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${appointySheetName}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  sendUpdate({ message: 'CSV data successfully pasted to "Appointy" sheet in AppointySheet.' });

  try {
    const frontSheetUrl = config.FrontSheet;
    const frontSpreadsheetId = extractSpreadsheetId(frontSheetUrl);
    if (frontSpreadsheetId) {
      const frontSheets = await getSheetsClient();
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const spreadsheet = await frontSheets.spreadsheets.get({ spreadsheetId: frontSpreadsheetId });
      const frontSheet = spreadsheet.data.sheets.find(
        s => s.properties.title.trim().toLowerCase() === 'front sheet'
      );
      if (frontSheet) {
        await frontSheets.spreadsheets.values.update({
          spreadsheetId: frontSpreadsheetId,
          range: `'Front Sheet'!A2`,
          valueInputOption: 'RAW',
          requestBody: { values: [[formatted]] }
        });
        sendUpdate({ message: `Front Sheet lastUpdated set to ${formatted}` });
      } else {
        sendUpdate({ error: 'Sheet "Front Sheet" not found in FrontSheet spreadsheet.' });
      }
    }
  } catch (e) {
    sendUpdate({ error: 'Failed to update FrontSheet lastUpdated', details: e.message });
  }

  try { fs.unlinkSync(downloadedFile); } catch (e) {}

  return true;
}


module.exports = { waitForDownloadAndCopyToSheet };
