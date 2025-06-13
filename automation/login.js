const { By, until } = require('selenium-webdriver');

async function login(driver, radiusUsername, password, emitter) {
  const wait = (locator) => driver.wait(until.elementLocated(locator), 10000);

  // Helper to emit updates if emitter is provided
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    sendUpdate({ message: 'Navigating to login page...' });
    await driver.get('https://radius.mathnasium.com/Account/Login');

    const usernameField = await wait(By.id('UserName'));
    const passwordField = await wait(By.id('Password'));
    const loginButton = await wait(By.id('login'));

    sendUpdate({ message: 'Entering username...' });
    await usernameField.sendKeys(radiusUsername);

    sendUpdate({ message: 'Entering password...' });
    await passwordField.sendKeys(password);

    await driver.executeScript('arguments[0].scrollIntoView(true);', loginButton);
    await driver.sleep(300);
    sendUpdate({ message: 'Clicking login button...' });
    await loginButton.click();

    await driver.wait(until.elementLocated(By.id('collapsedNavBar')), 10000);
    sendUpdate({ message: 'Login successful!' });
  } catch (err) {
    sendUpdate({ error: 'Login failed', details: err.message });
    throw err;
  }
}

module.exports = login;
