async function exportReport(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Exporting report...' });

  // headless causes weird issues, use tab to get to more options menu
  console.log('[exportReport] Focusing page and sending Tab x3 to reach More options...');
  await page.bringToFront();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  console.log('[exportReport] More options menu opened via keyboard.');

  let exportMenuAppeared = false;
  try {
    console.log('[exportReport] Waiting for Export menu item (first try)...');
    await page.waitForFunction(() => {
      const items = Array.from(document.querySelectorAll('li > div > span'));
      return items.some(span => span.textContent.trim() === 'Export');
    }, { timeout: 5000 });
    exportMenuAppeared = true;
    console.log('[exportReport] Export menu item appeared (first try).');
  } catch (e) {
    console.log('[exportReport] Export menu item not found, retrying Tab/Enter...');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    try {
      await page.waitForFunction(() => {
        const items = Array.from(document.querySelectorAll('li > div > span'));
        return items.some(span => span.textContent.trim() === 'Export');
      }, { timeout: 10000 });
      exportMenuAppeared = true;
      console.log('[exportReport] Export menu item appeared (second try).');
    } catch (err) {
      console.log('[exportReport] Export menu item still not found after retry.');
    }
  }

  if (exportMenuAppeared) {
    console.log('[exportReport] Clicking Export menu item...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li > div > span'));
      const exportSpan = items.find(span => span.textContent.trim() === 'Export');
      if (exportSpan) exportSpan.click();
    });

    console.log('[exportReport] Waiting for Export report modal...');
    await page.waitForFunction(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h2 => h2.textContent.trim() === 'Export report');
    }, { timeout: 10000 });

    // workaround to work in headless
    console.log('[exportReport] Sending Tab x3 and Enter to submit export...');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    sendUpdate({ message: 'Export initiated.' });
    console.log('[exportReport] Export initiated.');
  } else {
    sendUpdate({ message: 'Export menu did not appear.' });
    console.log('[exportReport] Export menu did not appear.');
  }
}

module.exports = { exportReport };
