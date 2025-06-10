const { By, until } = require('selenium-webdriver');

async function login(driver, radiusUsername, password) {
  const wait = (locator) => driver.wait(until.elementLocated(locator), 10000);

  try {
    console.log('🌐 Navigating to login page...');
    await driver.get('https://radius.mathnasium.com/Account/Login');

    const usernameField = await wait(By.id('UserName'));
    const passwordField = await wait(By.id('Password'));
    const loginButton = await wait(By.id('login'));

    await usernameField.sendKeys(radiusUsername);
    console.log('🔑 Entering username...' + radiusUsername);
    await passwordField.sendKeys(password);
    console.log('🔑 Entering password...' + password);

    // Simple scroll and native click
    await driver.executeScript('arguments[0].scrollIntoView(true);', loginButton);
    await driver.sleep(300);
    await loginButton.click();

    await driver.wait(until.elementLocated(By.id('collapsedNavBar')), 10000);
    console.log('✅ Login successful!');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    throw err;
  }
}

module.exports = login;
