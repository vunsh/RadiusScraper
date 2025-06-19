const { By, until } = require('selenium-webdriver');
const config = require('../constants/config.json');

async function clickSearchButton(driver) {
  const searchBtn = await driver.wait(until.elementLocated(By.id('btnsearch')), 10000);
  await searchBtn.click();
}

async function waitForTableData(driver, reportName, timeout = 90000) {
  // Wait for the loading mask to appear
  try {
    await driver.wait(
      until.elementLocated(By.css('.k-loading-mask')),
      10000
    );
  } catch (e) {
    // If it doesn't appear, maybe data loads instantly, continue
  }
  // Wait for the loading mask to disappear
  await driver.wait(async () => {
    const masks = await driver.findElements(By.css('.k-loading-mask'));
    return masks.length === 0 || !(await masks[0].isDisplayed());
  }, timeout, 'Table loading mask did not disappear in time');
}

async function clickExportButton(driver) {
  // Find a button with the exact text "Export to Excel"
  const exportBtn = await driver.wait(
    until.elementLocated(
      By.xpath("//button[normalize-space(text())='Export to Excel']")
    ),
    10000
  );
  await exportBtn.click();
}

module.exports = {
  clickSearchButton,
  waitForTableData,
  clickExportButton
};