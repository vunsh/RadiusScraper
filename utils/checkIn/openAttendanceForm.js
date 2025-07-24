const { By } = require('selenium-webdriver');

async function openAttendanceForm(driver, sendUpdate, incrementProgress) {
  try {
    const addAttendanceBtn = await driver.findElement(By.id('AddAttendanceBtn'));
    incrementProgress(3);
    
    await driver.executeScript('arguments[0].scrollIntoView(true);', addAttendanceBtn);
    await driver.sleep(300);
    incrementProgress(2);
    
    await addAttendanceBtn.click();
    sendUpdate({ message: 'Opening attendance form...' });
    incrementProgress(5);

    await driver.wait(async () => {
      const attendanceDiv = await driver.findElement(By.id('createAttendance'));
      const style = await attendanceDiv.getAttribute('style');
      return style && style.includes('display: block');
    }, 10000, 'Timeout waiting for attendance form to appear');
    
    sendUpdate({ message: 'Attendance form ready!' });
    incrementProgress(5);
    return true;
  } catch (err) {
    sendUpdate({ error: 'Unable to open attendance form', details: err.message });
    return false;
  }
}

module.exports = { openAttendanceForm };
