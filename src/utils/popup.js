import { EventEmitter } from 'events';

/**
 * @private
 */
export class Popup extends EventEmitter {
  constructor(url = '/') {
    super();
    this.url = url;
  }

  open() {
    throw new Error('method unsupported');
  }

  close() {
    throw new Error('method unsupported');
  }

  loadHandler() {
    throw new Error('method unsupported');
  }

  clickHandler() {
    throw new Error('method unsupported');
  }

  closeHandler() {
    throw new Error('method unsupported');
  }
}
