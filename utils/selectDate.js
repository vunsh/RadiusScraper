const { By, until, Key } = require('selenium-webdriver');

async function selectDate(driver, elementId, date) {
  try {
    const dateInput = await driver.wait(until.elementLocated(By.id(elementId)), 10000);
    await dateInput.click();
    await dateInput.clear();
    await dateInput.sendKeys(date);
    await dateInput.sendKeys(Key.RETURN);
    try {
      const wrapper = await dateInput.findElement(By.xpath('ancestor::span[contains(@class,"k-datepicker")]'));
      const calendarBtn = await wrapper.findElement(By.css('span.k-select'));
      await calendarBtn.click();
      await driver.sleep(200);
      await calendarBtn.click();
    } catch (e) {}
    const inputValue = await dateInput.getAttribute('value');
    const normalize = str => str.replace(/\b0?(\d)/g, '$1');
    if (normalize(inputValue) !== normalize(date)) {
      throw new Error(`Datepicker "${elementId}" did not set date to "${date}" (actual: "${inputValue}")`);
    }
    return true;
  } catch (err) {
    throw new Error(`selectDate failed for "${elementId}": ${err.message}`);
  }
}

module.exports = selectDate;
