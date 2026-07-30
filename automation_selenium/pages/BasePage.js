// automation_selenium/pages/BasePage.js
class BasePage {
  constructor(driver, config) {
    this.driver = driver;
    this.config = config || require('../config/selenium-config');
  }

  async open(path = '') {
    const targetUrl = `${this.config.baseUrl}${path}`;
    await this.driver.get(targetUrl);
  }

  async findElement(locator) {
    return await this.driver.findElement(locator);
  }

  async click(locator) {
    const element = await this.findElement(locator);
    await element.click();
  }

  async type(locator, text) {
    const element = await this.findElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }
}

module.exports = BasePage;
