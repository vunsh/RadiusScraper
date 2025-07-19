async function setDateFilter(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Setting date filter to "Today"...' });

  await new Promise(resolve => setTimeout(resolve, 2000));
  const dropdownSelector = 'div[aria-label="Choose date range"]';
  await page.waitForSelector(dropdownSelector, { timeout: 10000 });
  await page.click(dropdownSelector);

  const todaySelector = 'li[data-value="today"]';
  await page.waitForSelector(todaySelector, { timeout: 10000 });
  await page.click(todaySelector);

  await page.keyboard.press('Escape');

  sendUpdate({ message: 'Date filter set to "Today".' });
}

module.exports = { setDateFilter };
