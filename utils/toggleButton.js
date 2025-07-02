const { By, until } = require('selenium-webdriver');

async function toggleButton(driver, elementId) {
  try {
    const toggleElem = await driver.wait(until.elementLocated(By.id(elementId)), 10000);
    await toggleElem.click();
    await driver.sleep(200);
    
    const className = await toggleElem.getAttribute('class');
    if (!className.includes('toggleBtn-inverted')) {
      throw new Error(`Toggle button "${elementId}" did not switch to inverted state (classes: "${className}")`);
    }
    
    return true;
  } catch (err) {
    throw new Error(`toggleButton failed for "${elementId}": ${err.message}`);
  }
}

module.exports = toggleButton;
