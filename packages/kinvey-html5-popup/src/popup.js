const { EventEmitter } = require('events');

exports.Popup = class Popup extends EventEmitter {
  open(url = '/') {
    const that = this;
    const popupWindow = global.open(url, '_blank', 'toolbar=no,location=no');

    if (popupWindow) {
      // Check if the popup is closed has closed every 100ms
      const interval = global.setInterval(() => {
        if (popupWindow.closed) {
          global.clearInterval(interval);
          this.emit('exit');
        } else {
          try {
            const event = { url: popupWindow.location.href };
            this.emit('loadstart', event);
            this.emit('load', event);
          } catch (error) {
            if (error.code !== global.DOMException.SECURITY_ERR) {
              this.emit('error', error);
            }
          }
        }
      }, 100);
    } else {
      throw new Error('The popup was blocked.');
    }

    return {
      on(...args) {
        return that.on(...args);
      },

      close() {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }

        return this;
      },

      removeAllListeners(...args) {
        return that.removeAllListeners(...args);
      }
    };
  }

  static open(url) {
    const popup = new Popup();
    return popup.open(url);
  }
}
