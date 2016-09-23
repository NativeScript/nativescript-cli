import { Device } from './device';
import { EventEmitter } from 'events';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import bind from 'lodash/bind';
import isFunction from 'lodash/isFunction';

export class Popup extends EventEmitter {
  async open(url = '/', options = {}) {
    let interval;
    let eventListeners;
    let popupWindow;
    let titaniumWebView;
    let titaniumCloseButton;

    // Wait for the device to be ready if this is a Cordova environment
    if (typeof global.cordova !== 'undefined') {
      // Wait for the deivce to be ready
      await Device.ready();

      // Check that the InAppBrowser plugin is installed if this is a PhoneGap environment
      if (typeof global.cordova.InAppBrowser === 'undefined') {
        throw new Error('Cordova InAppBrowser Plugin is not installed.'
            + ' Please refer to https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser'
            + ' for help with installing the InAppBrowser plugin.');
      }
    }

    // clickHandler
    const clickHandler = () => {
      popupWindow.close();
    };

    // loadStartCallback
    const loadStartCallback = (event) => {
      this.emit('loadstart', event);
    };

    // loadStopCallback
    const loadStopCallback = (event) => {
      this.emit('loadstop', event);
    };

    // loadErrorCallback
    const loadErrorCallback = (event) => {
      this.emit('error', event);
    };

    // exitCallback
    const exitCallback = () => {
      // Clear the interval
      clearInterval(interval);

      // Close the popup
      popupWindow.close();
      this.popupWindow = null;

      // Remove event listeners
      if (popupWindow && isFunction(popupWindow.removeEventListener)) {
        popupWindow.removeEventListener('loadstart', eventListeners.loadStopCallback);
        popupWindow.removeEventListener('loadstop', eventListeners.loadStopCallback);
        popupWindow.removeEventListener('loaderror', eventListeners.loadErrorCallback);
        popupWindow.removeEventListener('close', eventListeners.exitCallback);
        popupWindow.removeEventListener('androidback', eventListeners.exitCallback);
        popupWindow.removeEventListener('exit', eventListeners.exitCallback);
      }

      if (titaniumWebView && isFunction(titaniumWebView.removeEventListener)) {
        titaniumWebView.removeEventListener('load', eventListeners.loadHandler);
        titaniumWebView.removeEventListener('error', eventListeners.loadHandler);
      }

      if (titaniumCloseButton && isFunction(titaniumCloseButton.removeEventListener)) {
        titaniumCloseButton.removeEventListener('click', eventListeners.clickHandler);
      }

      // Emit closed
      this.emit('closed');
    };

    // Bind event listeners
    eventListeners = {
      clickHandler: bind(clickHandler, this),
      loadStartCallback: bind(loadStartCallback, this),
      loadStopCallback: bind(loadStopCallback, this),
      loadErrorCallback: bind(loadErrorCallback, this),
      exitCallback: bind(exitCallback, this)
    };

    // Create popup window for Titanium
    if (typeof global.Titanium !== 'undefined' && typeof global.Titanium.UI !== 'undefined') {
      const titaniumWebView = global.Titanium.UI.createWebView({
        width: '100%',
        height: '100%',
        url: url
      });
      titaniumWebView.addEventListener('load', eventListeners.loadStopCallback);
      titaniumWebView.addEventListener('error', eventListeners.loadErrorCallback);

      popupWindow = global.Titanium.UI.createWindow({
        backgroundColor: 'white',
        barColor: '#000',
        title: options.title || 'Kinvey Mobile Identity Connect',
        modal: true
      });
      popupWindow.add(titaniumWebView);

      if (global.Titanium.Platform.osname === 'iphone' || global.Titanium.Platform.osname === 'ipad') {
        const tiWindow = global.Titanium.UI.createWindow({
          backgroundColor: 'white',
          barColor: '#e3e3e3',
          title: options.title || 'Kinvey Mobile Identity Connect',
        });
        tiWindow.add(titaniumWebView);

        titaniumCloseButton = global.Titanium.UI.createButton({
          title: 'Close',
          style: global.Titanium.UI.iPhone.SystemButtonStyle.DONE
        });
        tiWindow.setLeftNavButton(titaniumCloseButton);
        titaniumCloseButton.addEventListener('click', eventListeners.clickHandler);

        popupWindow = global.Titanium.UI.iOS.createNavigationWindow({
          backgroundColor: 'white',
          window: tiWindow,
          modal: true
        });
      } else if (global.Titanium.Platform.osname === 'android') {
        popupWindow.addEventListener('androidback', eventListeners.exitCallback);
      }

      // Open the popup
      popupWindow.addEventListener('close', eventListeners.exitCallback);
      popupWindow.open();
    } else {
      // Open the popup
      popupWindow = global.open(url, '_blank', 'location=yes');

      if (popupWindow) {
        if (isFunction(popupWindow.addEventListener)) {
          popupWindow.addEventListener('loadstart', eventListeners.loadStartCallback);
          popupWindow.addEventListener('loadstop', eventListeners.loadStopCallback);
          popupWindow.addEventListener('loaderror', eventListeners.loadErrorCallback);
          popupWindow.addEventListener('exit', eventListeners.exitCallback);
        }

        // Check if the popup is closed has closed every 100ms
        if (typeof global.cordova === 'undefined') {
          interval = setInterval(() => {
            if (popupWindow.closed) {
              eventListeners.exitCallback();
            } else {
              try {
                eventListeners.loadStopCallback({
                  url: popupWindow.location.href
                });
              } catch (error) {
                // Just catch the error
              }
            }
          }, 100);
        }
      } else {
        throw new Error('The popup was blocked.');
      }
    }

    // Set the popupWindow instance
    this.popupWindow = popupWindow;

    // Return this
    return this;
  }

  close() {
    if (this.popupWindow) {
      this.popupWindow.close();
    }

    return this;
  }
}
