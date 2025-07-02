const { By, until } = require('selenium-webdriver');

async function loginAppointments(driver, appointyUsername, appointyPassword, emitter) {
  const wait = (locator) => driver.wait(until.elementLocated(locator), 10000);

  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    sendUpdate({ message: 'Navigating to Appointy login page...' });
    await driver.get('https://mathnasium-admin.appointy.com/account/login?');
    const form = await wait(By.id('auth-login-form'));
    const emailInput = await form.findElement(By.name('email'));
    const passwordInput = await form.findElement(By.name('password'));

    sendUpdate({ message: 'Entering Appointy username...' });
    await emailInput.clear();
    await emailInput.sendKeys(appointyUsername);

    // Verify input value
    const emailValue = await emailInput.getAttribute('value');
    if (emailValue !== appointyUsername) {
      throw new Error('Email input did not update correctly');
    }

    sendUpdate({ message: 'Entering Appointy password...' });
    await passwordInput.clear();
    await passwordInput.sendKeys(appointyPassword);

    // Verify input value
    const passwordValue = await passwordInput.getAttribute('value');
    if (passwordValue !== appointyPassword) {
      throw new Error('Password input did not update correctly');
    }

    const submitBtn = await driver.wait(until.elementLocated(By.css('button[type="submit"][form="auth-login-form"]')), 10000);
    const btnType = await submitBtn.getAttribute('type');
    const btnForm = await submitBtn.getAttribute('form');
    if (btnType !== 'submit' || btnForm !== 'auth-login-form') {
      throw new Error('Submit button does not have correct type or form attribute');
    }

    sendUpdate({ message: 'Clicking login button...' });
    await submitBtn.click();

    await driver.wait(until.urlContains('/my-space'), 15000);
    sendUpdate({ message: 'Appointy login successful!' });
  } catch (err) {
    sendUpdate({ error: 'Appointy login failed', details: err.message });
    throw err;
  }
}

module.exports = loginAppointments;
