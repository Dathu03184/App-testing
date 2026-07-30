// automation_appium/pages/BasePage.js
class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector) {
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout: 10000 });
    return el;
  }

  async click(selector) {
    const el = await this.findElement(selector);
    await el.click();
  }

  async type(selector, text) {
    const el = await this.findElement(selector);
    await el.setValue(text);
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    return await el.getText();
  }
}

module.exports = BasePage;
