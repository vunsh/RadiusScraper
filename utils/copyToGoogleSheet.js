const { google } = require('googleapis');
const ExcelJS = require('exceljs');
const path = require('path');
const regions = require('../constants/regions.json');


function extractSpreadsheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}


async function loadExcelData(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const data = [];
  worksheet.eachRow((row) => {
    data.push(row.values.slice(1)); // Remove first empty element
  });
  return data;
}


async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../google-credentials.json'), 
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function copyToGoogleSheet(region, reportName, excelFilePath) {
  const regionInfo = regions[region];
  if (!regionInfo || !regionInfo.url) throw new Error(`No Google Sheet URL for region: ${region}`);
  const spreadsheetId = extractSpreadsheetId(regionInfo.url);
  if (!spreadsheetId) throw new Error(`Invalid Google Sheet URL: ${regionInfo.url}`);

  const sheets = await getSheetsClient();
  const data = await loadExcelData(excelFilePath);

  // Get current sheet names
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets.find(s => s.properties.title === reportName);

  // If sheet exists, clear it else, add it
  if (sheet) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${reportName}'`,
    });
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: reportName }
            }
          }
        ]
      }
    });
  }

  // Write data to the sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${reportName}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  return true;
}

module.exports = copyToGoogleSheet;
