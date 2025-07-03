const path = require('path');
const fs = require('fs');
const glob = require('glob');
const ExcelJS = require('exceljs');
const { selectDate, selectDropdown, fillMultiSelect, toggleButton } = require('./automation');
const { clickSearchButton, waitForTableData, clickExportButton } = require('./searchAndExport');
const copyToGoogleSheet = require('./copyToGoogleSheet');
const config = require('../constants/config.json');

async function waitForDownload(dir, timeout = 60000 * 5) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      glob(path.join(dir, '*.xlsx'), (err, files) => {
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

async function loadExcelRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const rows = [];
  worksheet.eachRow((row) => {
    rows.push(row.values.slice(1)); // Remove first empty element
  });
  return rows;
}

async function handleEnrollmentAllDropdown(driver, filters, emitter, absDownloadDir, excelFileName, region) {
  // Enrollment statuses to iterate
  const statuses = ['Enrolled', 'On Hold', 'Pre-Enrolled'];
  let combinedRows = [];
  let headerRow = null;
  let reportName = 'enrollment';

  let progress = 10;
  if (emitter) emitter.emit('update', JSON.stringify({ message: 'Starting special Enrollment report handling...', progress }));

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    progress = 10 + Math.floor((70 / statuses.length) * i);
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Running Enrollment report for status: ${status}`, progress }));

    const runFilters = (filters || []).map(f =>
      f.elementId === 'EnrollmentStatusDropDown'
        ? { ...f, type: 'dropdown', value: status }
        : f
    );
    if (!runFilters.some(f => f.elementId === 'EnrollmentStatusDropDown')) {
      runFilters.push({ type: 'dropdown', elementId: 'EnrollmentStatusDropDown', value: status });
    }

    for (const f of runFilters) {
      const { type, elementId, value } = f;
      if (type === 'date') {
        if (emitter) emitter.emit('update', JSON.stringify({ message: `Setting date filter "${elementId}" to "${value}"`, progress }));
        await selectDate(driver, elementId, value);
      } else if (type === 'dropdown') {
        if (emitter) emitter.emit('update', JSON.stringify({ message: `Setting dropdown "${elementId}" to "${value}"`, progress }));
        await selectDropdown(driver, elementId, value);
      } else if (type === 'multi') {
        if (emitter) emitter.emit('update', JSON.stringify({ message: `Setting multi-select "${elementId}"`, progress }));
        await fillMultiSelect(driver, elementId, value);
      } else if (type === 'toggle') {
        if (emitter) emitter.emit('update', JSON.stringify({ message: `Toggling button "${elementId}"`, progress }));
        await toggleButton(driver, elementId);
      }
    }

    progress += 5;
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Clicking Search for status "${status}"`, progress }));
    await clickSearchButton(driver);

    progress += 5;
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Waiting for table data for status "${status}"`, progress }));
    await waitForTableData(driver, reportName);

    progress += 5;
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Exporting to Excel for status "${status}"`, progress }));
    await clickExportButton(driver);

    progress += 5;
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Waiting for Excel download for status "${status}"`, progress }));
    const downloadedFile = await waitForDownload(absDownloadDir);
    const targetPath = path.join(absDownloadDir, `${excelFileName.replace('.xlsx', '')}_${status.replace(/ /g, '_')}.xlsx`);
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    fs.renameSync(downloadedFile, targetPath);

    progress += 5;
    if (emitter) emitter.emit('update', JSON.stringify({ message: `Loading Excel data for status "${status}"`, progress }));
    const rows = await loadExcelRows(targetPath);

    if (i === 0) {
      headerRow = rows[0];
      combinedRows = rows;
    } else {
      combinedRows = combinedRows.concat(rows.slice(1));
    }

    try { fs.unlinkSync(targetPath); } catch (e) {}
  }

  progress = 85;
  if (emitter) emitter.emit('update', JSON.stringify({ message: 'Combining all enrollment data into one Excel file...', progress }));
  const finalPath = path.join(absDownloadDir, excelFileName);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  combinedRows.forEach(row => worksheet.addRow(row));
  await workbook.xlsx.writeFile(finalPath);

  if (region) {
    progress = 95;
    if (emitter) emitter.emit('update', JSON.stringify({ message: 'Uploading combined enrollment data to Google Sheet...', progress }));
    await copyToGoogleSheet(region, reportName, finalPath);
    if (emitter) emitter.emit('update', JSON.stringify({ message: 'Combined enrollment data uploaded to Google Sheet.', progress: 98 }));
    try { fs.unlinkSync(finalPath); } catch (e) {}
  }

  progress = 100;
  if (emitter) emitter.emit('update', JSON.stringify({ message: 'Special Enrollment report handling complete.', done: true, progress }));
}

module.exports = handleEnrollmentAllDropdown;
