const { By, until } = require('selenium-webdriver');

async function navigateToStudentDetails(driver, studentId, sendUpdate, incrementProgress) {
  try {
    const url = `https://radius.mathnasium.com/Student/Details/${studentId}`;
    sendUpdate({ message: 'Locating your student profile...' });
    incrementProgress(2);
    
    await driver.get(url);
    incrementProgress(3);

    try {
      await driver.wait(
        until.elementLocated(By.className('remainingAlerts')),
        10000,
        'Timeout waiting for student details page'
      );
      incrementProgress(5);
      
      await driver.wait(async () => {
        const remainingAlertsDiv = await driver.findElement(By.className('remainingAlerts'));
        const classAttribute = await remainingAlertsDiv.getAttribute('class');
        return !classAttribute.includes('hidden');
      }, 10000, 'Timeout waiting for remaining alerts to load');
      incrementProgress(5);
      
    } catch (e) {
      sendUpdate({ error: 'Student details not found. Please check the Student ID.' });
      return false;
    }

    sendUpdate({ message: 'Student profile found!' });
    incrementProgress(3);
    
    try {
      const remainingAlertSpans = await driver.findElements(By.className('remainingAlertDetail'));
      incrementProgress(2);
      
      for (let span of remainingAlertSpans) {
        const spanText = await span.getText();
        if (spanText.trim() === '0') {
          sendUpdate({ error: 'Student has 0 remaining sessions. Cannot check in.' });
          return false;
        }
      }
      incrementProgress(2);
    } catch (err) {
      console.warn('Could not check remaining alert details:', err.message);
    }
    
    return true;
  } catch (err) {
    sendUpdate({ error: 'Error navigating to student details', details: err.message });
    return false;
  }
}

module.exports = { navigateToStudentDetails };

