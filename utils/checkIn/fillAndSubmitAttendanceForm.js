const { By, Key, until } = require('selenium-webdriver');

async function fillAndSubmitAttendanceForm(driver, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    const enrollmentInput = await driver.wait(until.elementLocated(By.id('EnrollmentDropDown')), 10000);
    const dropdownSpan = await enrollmentInput.findElement(By.xpath('..'));
    await dropdownSpan.click();
    await driver.sleep(200);
    await dropdownSpan.sendKeys(Key.ARROW_DOWN);
    await driver.sleep(100);
    await dropdownSpan.sendKeys(Key.ENTER);
    await driver.sleep(400);

    const kInputSpan = await dropdownSpan.findElement(By.css('.k-input'));
    const selectedText = await kInputSpan.getText();
    if (selectedText.includes('Select')) {
      sendUpdate({ error: 'Unable to select enrollment. Please try again.' });
      return false;
    }

    sendUpdate({ message: `Enrollment selected: ${selectedText}` });

    const departureInput = await driver.wait(until.elementLocated(By.id('DepartureTime')), 5000);
    await departureInput.clear();
    sendUpdate({ message: 'Departure time cleared.' });

    const saveBtn = await driver.wait(until.elementLocated(By.id('SaveAttendanceBtn')), 5000);
    await driver.executeScript('arguments[0].scrollIntoView(true);', saveBtn);
    await driver.sleep(200);
    await saveBtn.click();
    sendUpdate({ message: 'Attendance form submitted.' });

    return true;
  } catch (err) {
    sendUpdate({ error: 'Error submitting attendance form', details: err.message });
    return false;
  }
}

module.exports = { fillAndSubmitAttendanceForm };
