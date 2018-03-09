import Promise from 'es6-promise';
import { noop, wrapInPromise } from './misc';

export class PromiseQueue {
  constructor(maxPendingPromises = 1, maxQueuedPromises = Infinity) {
    this.pendingPromises = 0;
    this.maxPendingPromises = maxPendingPromises;
    this.maxQueuedPromises = maxQueuedPromises;
    this.queue = [];
  }

  enqueue(promiseGenerator) {
    return new Promise((resolve, reject, notify) => {
      if (this.queue.length >= this.maxQueuedPromises) {
        reject(new Error('Queue limit reached'));
        return;
      }

      this.queue.push({
        promiseGenerator: promiseGenerator,
        resolve: resolve,
        reject: reject,
        notify: notify || noop
      });

      this._dequeue();
    });
  }

  getPendingLength() {
    return this.pendingPromises;
  }

  getQueueLength() {
    return this.queue.length;
  }

  _dequeue() {
    if (this.pendingPromises >= this.maxPendingPromises) {
      return false;
    }

    // Remove from queue
    const item = this.queue.shift();
    if (!item) {
      return false;
    }

    try {
      this.pendingPromises += 1;
      wrapInPromise(item.promiseGenerator())
        // Forward all stuff
        .then((value) => {
          // It is not pending now
          this.pendingPromises -= 1;
          // It should pass values
          item.resolve(value);
          this._dequeue();
        }, (err) => {
          // It is not pending now
          this.pendingPromises -= 1;
          // It should not mask errors
          item.reject(err);
          this._dequeue();
        }, (message) => {
          // It should pass notifications
          item.notify(message);
        });
    } catch (err) {
      this.pendingPromises -= 1;
      item.reject(err);
      this._dequeue();
    }

    return true;
  }
}
