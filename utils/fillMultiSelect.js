const { By, until, Key } = require('selenium-webdriver');

async function fillMultiSelect(driver, elementId, values) {
  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const selectElem = await driver.wait(until.elementLocated(By.id(elementId)), 10000);
      const wrapper = await selectElem.findElement(By.xpath('..'));
      let input;
      try {
        input = await wrapper.findElement(By.css('input.k-input'));
      } catch (e) {
        if (attempt === maxRetries) throw e;
        await driver.sleep(retryDelay);
        continue;
      }
      await driver.switchTo().defaultContent();
      await driver.executeScript('window.focus()');
      for (const value of values) {
        await input.clear();
        await input.click();
        await input.sendKeys(value);
        await driver.sleep(200);
        await input.sendKeys(Key.RETURN);
        await driver.sleep(400);
      }
      let tagList;
      try {
        tagList = await wrapper.findElement(By.css('ul[id$="_taglist"]'));
      } catch (e) {
        if (attempt === maxRetries) throw e;
        await driver.sleep(retryDelay);
        continue;
      }
      const selectedLis = await tagList.findElements(By.css('li.k-button, li[role="option"]'));
      const selectedTexts = [];
      for (const li of selectedLis) {
        const span = await li.findElement(By.css('span'));
        selectedTexts.push((await span.getText()).trim());
      }
      for (const value of values) {
        if (!selectedTexts.includes(value.trim())) {
          throw new Error(`Failed to select "${value}" in multi-select "${elementId}"`);
        }
      }
      return true;
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`fillMultiSelect failed for "${elementId}" after ${maxRetries} attempts: ${err.message}`);
      }
      await driver.sleep(retryDelay);
    }
  }
}

module.exports = fillMultiSelect;
