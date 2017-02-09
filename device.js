let deviceReady;

export default class Device {
  static isPhoneGap() {
    if (typeof document !== 'undefined') {
      return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    }

    return false;
  }

  static isiOS() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'ios';
  }

  static isAndroid() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'android';
  }

  static ready() {
    if (typeof deviceReady === 'undefined') {
      if (this.isPhoneGap()) {
        deviceReady = new Promise((resolve) => {
          const onDeviceReady = () => {
            document.removeEventListener('deviceready', onDeviceReady);
            resolve();
          };

          document.addEventListener('deviceready', onDeviceReady, false);
        });
      } else {
        deviceReady = Promise.resolve();
      }
    }

    return deviceReady;
  }
}

// Check that cordova plugins are installed
if (Device.isPhoneGap()) {
  Device.ready().then(() => {
    if (typeof global.device === 'undefined') {
      throw new Error('Cordova Device Plugin is not installed.'
        + ' Please refer to https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device/index.html for help with'
        + ' installing the Cordova Device Plugin.');
    }
  });
}
