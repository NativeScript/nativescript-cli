import bind from 'lodash/bind';

/**
 * @private
 */
export class PopupAdapter {
  open() {
    this.eventListeners = {
      loadHandler: bind(this.loadHandler, this),
      closeHandler: bind(this.closeHandler, this)
    };

    const promise = new Promise((resolve, reject) => {
      this.popup = global.open(this.url, '_blank', 'location=yes');

      if (this.popup) {
        this.popup.addEventListener('loadstart', this.eventListeners.loadHandler);
        this.popup.addEventListener('exit', this.eventListeners.closeHandler);
      } else {
        return reject(new Error('The popup was blocked.'));
      }

      return resolve();
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
    this.popup.removeEventListener('loadstart', this.eventListeners.loadHandler);
    this.popup.removeEventListener('exit', this.eventListeners.closeHander);
    this.emit('closed');
  }
}
