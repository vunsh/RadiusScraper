const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const login = require('./login');
const { navigateToPage, selectDate, selectDropdown } = require('../utils/automation');
require('dotenv').config();

async function runReport() {
  const options = new chrome.Options();
  options
//   .addArguments('--headless')
    .addArguments('--no-sandbox')
    .addArguments('--disable-dev-shm-usage')
    .addArguments('--disable-gpu'); 

options.addArguments('--disable-autofill-keyboard-accessory-view');
options.addArguments('--disable-autofill');
options.addArguments('--disable-save-password-bubble');
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await login(driver, process.env.RADIUSUSERNAME, process.env.PASSWORD);

    // Test: Navigate to attendance report and select a date
    await navigateToPage(driver, 'https://radius.mathnasium.com/StudentAttendanceMonthlyReport');
    await selectDate(driver, 'ReportStart', '03/25/2025');
    console.log('Date selected successfully.');

    // Test: Select a value from a dropdown
    await selectDropdown(driver, 'DeliveryOptionsFilter', 'All');
    console.log('Dropdown selected successfully.');

  } catch (err) {
    console.error('❌ Automation error:', err);
  } finally {
    // await driver.quit();
  }
}

module.exports = runReport;
