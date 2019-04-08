import { EventEmitter } from 'events';

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';

class Popup extends EventEmitter {
  private popupWindow: Window | null;
  private interval: number | null;

  constructor(popupWindow: Window) {
    super();
    this.popupWindow = popupWindow;
    this.interval = window.setInterval(() => {
      if (popupWindow.closed) {
        this.close();
      } else {
        try {
          const event = { url: popupWindow.location.href };
          this.emit(LOADED_EVENT, event);
        } catch (error) {
          if (error.code !== (window as any).DOMException.SECURITY_ERR) {
            this.emit(ERROR_EVENT, error);
          }
        }
      }
    }, 100);
  }

  isClosed() {
    return this.popupWindow && this.popupWindow.closed === true || false;
  }

  onLoaded(listener: (...args: any[]) => void) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener: (...args: any[]) => void) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener: (...args: any[]) => void) {
    return this.on(ERROR_EVENT, listener);
  }

  async close() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
    }

    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
      this.popupWindow = null;
    }

    this.emit(CLOSED_EVENT);
  }

  static async open(url: string) {
    const popupWindow = window.open(url, '_blank', 'toolbar=no,location=no');

    if (!popupWindow) {
      throw new Error('The popup was blocked.');
    }

    return new Popup(popupWindow);
  }
}

export function open(url: string) {
  return Popup.open(url);
}
