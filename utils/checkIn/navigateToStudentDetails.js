const { By, until } = require('selenium-webdriver');

async function navigateToStudentDetails(driver, studentId, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    const url = `https://radius.mathnasium.com/Student/Details/${studentId}`;
    sendUpdate({ message: 'Locating your student profile...' });
    await driver.get(url);

    try {
      await driver.wait(
        until.elementLocated(By.id('enrollDash')),
        10000,
        'Timeout waiting for student details page'
      );
    } catch (e) {
      sendUpdate({ error: 'Student details not found. Please check the Student ID.' });
      return false;
    }

    const enrollDashElems = await driver.findElements(By.id('enrollDash'));
    if (enrollDashElems.length === 0) {
      sendUpdate({ error: 'Student details not found. Please check the Student ID.' });
      return false;
    }

    sendUpdate({ message: 'Student profile found!' });
    return true;
  } catch (err) {
    sendUpdate({ error: 'Error navigating to student details', details: err.message });
    return false;
  }
}

module.exports = { navigateToStudentDetails };

