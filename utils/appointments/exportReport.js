async function exportReport(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Exporting report...' });

  const moreOptionsSelector = 'button[aria-label="More options"]';
  await page.waitForSelector(moreOptionsSelector, { timeout: 10000 });
  await page.click(moreOptionsSelector);

  let exportMenuAppeared = false;
  try {
    await page.waitForFunction(() => {
      const items = Array.from(document.querySelectorAll('li > div > span'));
      return items.some(span => span.textContent.trim() === 'Export');
    }, { timeout: 5000 });
    exportMenuAppeared = true;
  } catch (e) {
    await page.click(moreOptionsSelector);
    await page.waitForFunction(() => {
      const items = Array.from(document.querySelectorAll('li > div > span'));
      return items.some(span => span.textContent.trim() === 'Export');
    }, { timeout: 10000 });
    exportMenuAppeared = true;
  }

  if (exportMenuAppeared) {
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li > div > span'));
      const exportSpan = items.find(span => span.textContent.trim() === 'Export');
      if (exportSpan) exportSpan.click();
    });

    await page.waitForFunction(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.some(span => span.textContent.includes('Export to file'));
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const exportToFileSpan = spans.find(span => span.textContent.includes('Export to file'));
      if (exportToFileSpan) {
        let radio = exportToFileSpan.closest('label')?.querySelector('input[type="radio"]');
        if (!radio) {
          radio = exportToFileSpan.parentElement?.querySelector('input[type="radio"]');
        }
        if (radio) radio.click();
      }
    });

    await page.waitForSelector('button[type="submit"][form="report-export-option"]', { timeout: 10000 });
    await page.click('button[type="submit"][form="report-export-option"]');

    sendUpdate({ message: 'Export initiated.' });
  } else {
    sendUpdate({ message: 'Export menu did not appear.' });
  }
}

module.exports = { exportReport };
