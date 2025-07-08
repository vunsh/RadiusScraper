const { By, until } = require('selenium-webdriver');
const navigateToPage = require('../../utils/navigateToPage');

const REVIEW_URL = 'https://www.google.com/search?sca_esv=c9fe79b891b509d9&si=AMgyJEvkVjFQtirYNBhM3ZJIRTaSJ6PxY6y1_6WZHGInbzDnMfwpcsBHl4gkojq6LdtEQeIwrnLsNf3AvxE1Kd0M3siW6P3aw6cYOFf6f12c0bCZoPU-OstBxXVrvshuk1MWx70Dqa19&q=Mathnasium+Reviews&sa=X&ved=2ahUKEwiXy6OnjKyOAxWNEkQIHXE0BZkQ0bkNegQIKxAE&biw=1536&bih=791&dpr=1.25';

async function getAllReviews(driver) {
  await navigateToPage(driver, REVIEW_URL);

  try {
    await driver.wait(
      until.elementLocated(By.xpath('//span[text()="Google review summary"]')),
      8000
    );
    return { success: true, message: 'Google review summary found.' };
  } catch (err) {
    return { success: false, message: 'Google review summary not found. Not a valid review location.' };
  }
}

module.exports = getAllReviews;
