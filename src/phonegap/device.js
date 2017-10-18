import { Promise } from 'es6-promise';

let deviceReady;

const Device = {
  isPhoneGap() {
    if (typeof global.document !== 'undefined') {
      return global.document.URL.indexOf('http://') === -1 && global.document.URL.indexOf('https://') === -1;
    }

    return false;
  },

  isiOS() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'ios';
  },

  isAndroid() {
    return typeof global.device !== 'undefined' && global.device.platform.toLowerCase() === 'android';
  },

  ready() {
    if (typeof deviceReady === 'undefined') {
      if (this.isPhoneGap()) {
        deviceReady = new Promise((resolve) => {
          const onDeviceReady = () => {
            global.document.removeEventListener('deviceready', onDeviceReady);
            resolve();
          };

          global.document.addEventListener('deviceready', onDeviceReady, false);
        });
      } else {
        deviceReady = Promise.resolve();
      }
    }

    return deviceReady;
  }
};
export { Device };

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
