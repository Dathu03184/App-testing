// automation_appium/config/appium-config.js
module.exports = {
  server: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/'
  },
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE || 'Android Emulator',
    'appium:platformVersion': process.env.ANDROID_VERSION || '11.0',
    'appium:app': process.env.APK_PATH || './app-release.apk',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 300,
    'appium:noReset': false
  }
};
