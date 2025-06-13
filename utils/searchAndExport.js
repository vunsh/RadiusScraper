const { By, until } = require('selenium-webdriver');
const config = require('../constants/config.json');

async function clickSearchButton(driver) {
  const searchBtn = await driver.wait(until.elementLocated(By.id('btnsearch')), 10000);
  await searchBtn.click();
}

async function waitForTableData(driver, reportName, timeout = 20000) {
  const tableDivId = config.tableDivIds[reportName];
  if (!tableDivId) throw new Error(`No tableDivId configured for report: ${reportName}`);
  const tableDiv = await driver.wait(until.elementLocated(By.id(tableDivId)), 10000);
  const table = await tableDiv.findElement(By.css('table'));
  const tbody = await table.findElement(By.css('tbody'));

  // Wait until the .k-no-data row disappears (data loaded)
  await driver.wait(async () => {
    const rows = await tbody.findElements(By.css('tr'));
    for (const row of rows) {
      const classes = await row.getAttribute('class');
      if (classes && classes.includes('k-no-data')) {
        return false;
      }
    }
    return rows.length > 0;
  }, timeout, 'Table data did not load in time');
}

async function clickExportButton(driver) {
  const exportBtn = await driver.wait(until.elementLocated(By.id('btnExport')), 10000);
  await exportBtn.click();
}

module.exports = {
  clickSearchButton,
  waitForTableData,
  clickExportButton
};
