/* global Titanium:false */
import { Device } from '../device';
import { EventEmitter } from 'events';
import bind from 'lodash/bind';

/**
 * @private
 */
export class Popup extends EventEmitter {
  constructor(url = '/') {
    super();
    this.url = url;
    this.eventListeners = {
      loadHandler: bind(this.loadHandler, this),
      clickHandler: bind(this.clickHandler, this),
      closeHandler: bind(this.closeHandler, this)
    };
  }

  open() {
    const device = new Device();
    const promise = new Promise((resolve, reject) => {
      if (device.isCordova()) {
        this.popup = global.open(this.url, '_blank', 'location=yes');

        if (this.popup) {
          this.popup.addEventListener('loadstart', this.eventListeners.loadHandler);
          this.popup.addEventListener('exit', this.eventListeners.closeHandler);
        } else {
          reject(new Error('The popup was blocked.'));
        }
      } else if (device.isTitanium()) {
        this.tiWebView = Titanium.UI.createWebView({
          width: '100%',
          height: '100%',
          url: this.url
        });

        this.popup = Titanium.UI.createWindow({
          backgroundColor: 'white',
          barColor: '#000',
          title: 'Mobile Identity Connect',
          modal: true
        });
        this.popup.add(this.tiWebView);

        if (device.os.name === 'ios') {
          this.tiWin = Titanium.UI.createWindow({
            backgroundColor: 'white',
            barColor: '#e3e3e3',
            title: 'Mobile Identity Connect'
          });
          this.tiWin.add(this.tiWebView);

          this.tiCloseButton = Titanium.UI.createButton({
            title: 'Close',
            style: Titanium.UI.iPhone.SystemButtonStyle.DONE
          });
          this.tiWin.setLeftNavButton(this.tiCloseButton);
          this.tiCloseButton.addEventListener('click', this.eventListeners.clickHandler);

          this.popup = Titanium.UI.iOS.createNavigationWindow({
            backgroundColor: 'white',
            window: this.tiWin,
            modal: true
          });
        } else if (device.os.name === 'android') {
          this.popup.addEventListener('androidback', this.eventListeners.closeHandler);
        }

        this.tiWebView.addEventListener('load', this.eventListeners.loadHandler);
        this.tiWebView.addEventListener('error', this.eventListeners.loadHandler);
        this.popup.addEventListener('close', this.eventListeners.closeHandler);
        this.popup.open();
      } else {
        this.popup = global.open(this.url, '_blank', 'toolbar=no,location=no');

        if (this.popup) {
          this.interval = setInterval(() => {
            if (this.popup.closed) {
              this.closeHandler();
            } else {
              try {
                this.loadHandler({
                  url: this.popup.location.href
                });
              } catch (e) {
                // catch any errors due to cross domain issues
              }
            }
          }, 100);
        } else {
          reject(new Error('The popup was blocked.'));
        }
      }

      resolve();
    });

    return promise;
  }

  close() {
    const promise = new Promise(resolve => {
      this.popup.close();
      resolve();
    });
    return promise;
  }

  loadHandler(event) {
    this.emit('load', event.url);
  }

  clickHandler() {
    this.close();
  }

  closeHandler() {
    const device = new Device();
    clearTimeout(this.interval);

    if (device.isCordova()) {
      this.popup.removeEventListener('loadstart', this.eventListeners.loadHandler);
      this.popup.removeEventListener('exit', this.eventListeners.closeHander);
    } else if (device.isTitanium()) {
      this.tiWebView.removeEventListener('load', this.eventListeners.loadHandler);
      this.tiWebView.removeEventListener('error', this.eventListeners.loadHandler);
      this.popup.removeEventListener('close', this.eventListeners.closeHandler);

      if (device.os.name === 'ios') {
        this.tiCloseButton.removeEventListener('click', this.eventListeners.clickHandler);
      } else if (device.os.name === 'android') {
        this.popup.close();
        this.popup.removeEventListener('androidback', this.eventListeners.closeHandler);
      }
    }

    this.emit('close');
  }
}
