const { By, until, Key } = require('selenium-webdriver');

async function selectDropdown(driver, elementId, value) {
  try {
    const inputElem = await driver.wait(until.elementLocated(By.id(elementId)), 10000);
    const widget = await inputElem.findElement(By.xpath('..'));
    await widget.click();
    await widget.sendKeys(value);
    await driver.sleep(200);
    await widget.sendKeys(Key.RETURN);
    await driver.sleep(400);
    const visibleInput = await widget.findElement(By.css('.k-input'));
    const selectedText = await visibleInput.getText();
    if (selectedText.trim() !== value.trim()) {
      throw new Error(`Dropdown "${elementId}" did not select "${value}" (selected: "${selectedText}")`);
    }
    return true;
  } catch (err) {
    throw new Error(`selectDropdown failed for "${elementId}": ${err.message}`);
  }
}

module.exports = selectDropdown;
