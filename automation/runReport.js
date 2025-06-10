const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const login = require('./login');
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


  } catch (err) {
    console.error('❌ Automation error:', err);
  } finally {
    await driver.quit();
  }
}

module.exports = runReport;
