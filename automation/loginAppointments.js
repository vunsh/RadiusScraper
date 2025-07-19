async function loginAppointments(page, appointyUsername, appointyPassword, emitter) {
  function sendUpdate(msg) {
    if (emitter) emitter.emit('update', JSON.stringify(msg));
  }

  try {
    sendUpdate({ message: 'Navigating to Appointy login page...' });
    await page.goto('https://mathnasium-admin.appointy.com/account/login?');

    await page.waitForSelector('#auth-login-form input[name="email"]');
    sendUpdate({ message: 'Entering Appointy username...' });
    await page.type('input[name="email"]', appointyUsername, { delay: 50 });

    const emailValue = await page.$eval('input[name="email"]', el => el.value);
    if (emailValue !== appointyUsername) throw new Error('Email input did not update correctly');

    sendUpdate({ message: 'Entering Appointy password...' });
    await page.type('input[name="password"]', appointyPassword, { delay: 50 });

    const passwordValue = await page.$eval('input[name="password"]', el => el.value);
    if (passwordValue !== appointyPassword) throw new Error('Password input did not update correctly');

    sendUpdate({ message: 'Clicking login button...' });
    await page.click('button[type="submit"][form="auth-login-form"]');

    await page.waitForFunction(() => window.location.pathname.includes('/my-space'), { timeout: 15000 });
    if (!page.url().includes('/my-space')) throw new Error('Login redirect failed');

    sendUpdate({ message: 'Appointy login successful!' });
  } catch (err) {
    sendUpdate({ error: 'Appointy login failed', details: err.message });
    throw err;
  }
}

module.exports = loginAppointments;
