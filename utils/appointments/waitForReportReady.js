async function waitForReportReady(page, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }
  sendUpdate({ message: 'Waiting for report to finish loading...' });

  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('div[class*="MuiLinearProgress-root"]');
      return el && window.getComputedStyle(el).opacity === '1';
    }, { timeout: 15000 });
  } catch (e) {
    sendUpdate({ message: 'Progress bar did not appear in time, continuing...' });
  }

  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('div[class*="MuiLinearProgress-root"]');
      return el && window.getComputedStyle(el).opacity === '0';
    }, { timeout: 15 * 1000 });
  } catch (e) {
    sendUpdate({ message: 'Progress bar did not disappear in time, continuing...' });
  }

  sendUpdate({ message: 'Report is ready for export.' });
}

module.exports = { waitForReportReady };
