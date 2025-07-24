const { By } = require('selenium-webdriver');

async function openAttendanceForm(driver, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    const addAttendanceBtn = await driver.findElement(By.id('AddAttendanceBtn'));
    await driver.executeScript('arguments[0].scrollIntoView(true);', addAttendanceBtn);
    await driver.sleep(300);
    await addAttendanceBtn.click();
    sendUpdate({ message: 'Opening attendance form...' });

    await driver.wait(async () => {
      const attendanceDiv = await driver.findElement(By.id('createAttendance'));
      const style = await attendanceDiv.getAttribute('style');
      return style && style.includes('display: block');
    }, 10000, 'Timeout waiting for attendance form to appear');
    sendUpdate({ message: 'Attendance form ready!' });
    return true;
  } catch (err) {
    sendUpdate({ error: 'Unable to open attendance form', details: err.message });
    return false;
  }
}

module.exports = { openAttendanceForm };
