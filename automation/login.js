const { By, until } = require('selenium-webdriver');

async function login(driver, radiusUsername, password, sendUpdate, incrementProgress) {
  const wait = (locator) => driver.wait(until.elementLocated(locator), 10000);

  try {
    sendUpdate({ message: 'Navigating to login page...' });
    incrementProgress?.(2);

    await driver.get('https://radius.mathnasium.com/Account/Login');

    const usernameField = await wait(By.id('UserName'));
    const passwordField = await wait(By.id('Password'));
    const loginButton = await wait(By.id('login'));

    sendUpdate({ message: 'Entering username...' });
    incrementProgress?.(2);
    await usernameField.sendKeys(radiusUsername);

    sendUpdate({ message: 'Entering password...' });
    incrementProgress?.(2);
    await passwordField.sendKeys(password);

    await driver.executeScript('arguments[0].scrollIntoView(true);', loginButton);
    await driver.sleep(300);
    sendUpdate({ message: 'Clicking login button...' });
    incrementProgress?.(2);
    await loginButton.click();

    try {
      await driver.wait(
        async () => {
          const errorElems = await driver.findElements(By.css('.validation-summary-errors'));
          if (errorElems.length > 0) return true;
          const navElems = await driver.findElements(By.id('collapsedNavBar'));
          return navElems.length > 0;
        },
        10000,
        'Neither login success nor error appeared in time'
      );
    } catch (e) {
      sendUpdate({ error: 'Login failed', details: 'Timeout waiting for login result.' });
      throw new Error('Timeout waiting for login result.');
    }

    const errorElems = await driver.findElements(By.css('.validation-summary-errors'));
    if (errorElems.length > 0) {
      try {
        const ul = await errorElems[0].findElement(By.css('ul'));
        const li = await ul.findElement(By.css('li'));
        const errorMsg = await li.getText();
        sendUpdate({ error: 'Login failed', details: errorMsg });
        throw new Error(errorMsg);
      } catch (err) {
        sendUpdate({ error: 'Login failed', details: 'Password incorrect (error extracting message)' });
        throw new Error('Password incorrect (error extracting message)');
      }
    }

    sendUpdate({ message: 'Login successful!' });
    incrementProgress?.(2);
  } catch (err) {
    if (!err.message || !err.message.includes('Login failed')) {
      sendUpdate({ error: 'Login failed', details: err.message });
    }
    throw err;
  }
}

module.exports = login;
