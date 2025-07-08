const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const getAllReviews = require('../utils/google/getAllReviews');
require('dotenv').config();

async function runReviews({ centers }) {
  const options = new chrome.Options();
  options
    // .addArguments('--headless')
    .addArguments('--no-sandbox')
    .addArguments('--disable-dev-shm-usage')
    .addArguments('--disable-gpu');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('Centers for review:', centers);
    const result = await getAllReviews(driver);
    if (!result.success) {
      console.log('Review job ended early:', result.message);
      return;
    }
    console.log('Review job status:', result.message);
    // ...future review logic...
  } finally {
    await driver.quit();
  }
}

module.exports = runReviews;
