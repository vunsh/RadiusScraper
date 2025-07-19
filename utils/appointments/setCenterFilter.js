async function setCenterFilter(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Setting center filter to "All Locations"...' });

  const dropdownSelector = 'div[aria-label="Choose Locations"]';
  await page.waitForSelector(dropdownSelector, { timeout: 10000 });
  await page.click(dropdownSelector);

  const allLocationsSelector = 'li[data-value="allLocations"]';
  await page.waitForSelector(allLocationsSelector, { timeout: 10000 });
  await page.click(allLocationsSelector);

  await page.keyboard.press('Escape');

  sendUpdate({ message: 'Center filter set to "All Locations".' });
}

module.exports = { setCenterFilter };
