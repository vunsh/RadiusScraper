const { By, Key, until } = require('selenium-webdriver');

async function fillAndSubmitAttendanceForm(driver, sendUpdate, incrementProgress) {
  try {
    const enrollmentInput = await driver.wait(until.elementLocated(By.id('EnrollmentDropDown')), 10000);
    incrementProgress(3);
    
    const dropdownSpan = await enrollmentInput.findElement(By.xpath('..'));
    await dropdownSpan.click();
    incrementProgress(2);
    
    await driver.sleep(200);
    await dropdownSpan.sendKeys(Key.ARROW_DOWN);
    incrementProgress(2);
    
    await driver.sleep(100);
    await dropdownSpan.sendKeys(Key.ENTER);
    await driver.sleep(400);
    incrementProgress(3);

    await driver.sleep(1500);
    const kInputSpan = await dropdownSpan.findElement(By.css('.k-input'));
    const selectedText = await kInputSpan.getText();
    if (selectedText.includes('Select')) {
      sendUpdate({ error: 'Unable to select enrollment. Please try again.' });
      return false;
    }

    sendUpdate({ message: `Enrollment selected: ${selectedText}` });
    incrementProgress(3);

    const departureInput = await driver.wait(until.elementLocated(By.id('DepartureTime')), 5000);
    await departureInput.clear();
    sendUpdate({ message: 'Departure time cleared.' });
    incrementProgress(3);

    const saveBtn = await driver.wait(until.elementLocated(By.id('SaveAttendanceBtn')), 5000);
    incrementProgress(2);
    
    await driver.executeScript('arguments[0].scrollIntoView(true);', saveBtn);
    await driver.sleep(200);
    incrementProgress(2);
    
    await saveBtn.click();
    sendUpdate({ message: 'Attendance form submitted.' });
    incrementProgress(5);

    try {
      await driver.sleep(500); 
      const modals = await driver.findElements(By.css('div#kendoWindow'));
      for (const modal of modals) {
        const parentId = await modal.getAttribute('id');
        if (parentId === 'hybridDeliveryOptionModal') continue;

        const h3s = await modal.findElements(By.css('h3'));
        for (const h3 of h3s) {
          const text = await h3.getText();
          if (text.trim() === 'Please choose delivery type:') {
            const confirmBtns = await modal.findElements(By.css('#confirmHybridAttBtn'));
            if (confirmBtns.length > 0) {
              await confirmBtns[0].click();
              sendUpdate({ message: 'Confirmed delivery type.' });
              incrementProgress(2);
            }
            break;
          }
        }
      }
    } catch (modalErr) {
      sendUpdate({ message: 'No delivery type modal detected or error handling it.', details: modalErr.message });
    }

    return true;
  } catch (err) {
    sendUpdate({ error: 'Error submitting attendance form', details: err.message });
    return false;
  }
}


module.exports = { fillAndSubmitAttendanceForm };
