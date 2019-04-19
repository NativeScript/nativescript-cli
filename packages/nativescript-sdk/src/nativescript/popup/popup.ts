/* THIS IS A PLACEHOLDER FILE AND WILL BE REMOVED WHEN NATIVESCRIPT BUILDS */

import { EventEmitter } from 'events';

export class Popup extends EventEmitter {
  isClosed() {
    return true;
  }

  onLoaded(listener: (event: any) => void): this {
    return this;
  }

  onClosed(listener: () => void): this {
    return this;
  }

  onError(listener: () => void): this {
    return this;
  }

  async close(): Promise<void> {
    return;
  }

  static async open(url: string, options?: any): Promise<Popup> {
    throw new Error('Popup does not work.')
  }
}
