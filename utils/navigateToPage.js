const { until } = require('selenium-webdriver');

async function navigateToPage(driver, url) {
  try {
    await driver.get(url);
    await driver.wait(async () => {
      const readyState = await driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, 10000, 'Page did not load in time');
  } catch (err) {
    throw new Error(`Failed to navigate to ${url}: ${err.message}`);
  }
}

module.exports = navigateToPage;
