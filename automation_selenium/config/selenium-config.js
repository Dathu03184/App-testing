// automation_selenium/config/selenium-config.js
module.exports = {
  baseUrl: process.env.BASE_URL || 'https://dathu03184.github.io/PDD-App-Development/',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT || '15000', 10),
  viewport: { width: 1280, height: 800 }
};
