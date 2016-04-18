import { EventEmitter } from 'events';
import { isBrowser } from './utils';
import bind from 'lodash/bind';

/**
 * @private
 */
export class Popup extends EventEmitter {
  open() {
    this.eventListeners = {
      loadHandler: bind(this.loadHandler, this),
      closeHandler: bind(this.closeHandler, this)
    };

    const promise = new Promise((resolve, reject) => {
      if (isBrowser()) {
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
          return reject(new Error('The popup was blocked.'));
        }
      } else {
        this.popup = global.open(this.url, '_blank', 'location=yes');

        if (this.popup) {
          this.popup.addEventListener('loadstart', this.eventListeners.loadHandler);
          this.popup.addEventListener('exit', this.eventListeners.closeHandler);
        } else {
          return reject(new Error('The popup was blocked.'));
        }
      }

      return resolve(this);
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
    this.emit('loaded', event.url);
  }

  clickHandler() {
    this.close();
  }

  closeHandler() {
    clearTimeout(this.interval);
    this.popup.removeEventListener('loadstart', this.eventListeners.loadHandler);
    this.popup.removeEventListener('exit', this.eventListeners.closeHander);
    this.emit('closed');
  }
}

