import { PromiseQueue } from '../../utils';

export class InmemoryCrudQueue {
  _simultaneousOpsCount;
  _maxQueueLength;
  _queuesByKey = {};

  constructor(simultaneousOpsCount = 1, maxQueueLength = Infinity) {
    this._simultaneousOpsCount = simultaneousOpsCount;
    this._maxQueueLength = maxQueueLength;
  }

  enqueue(key, operation) {
    if (!this._queuesByKey[key]) {
      this._queuesByKey[key] = new PromiseQueue(this._simultaneousOpsCount, this._maxQueueLength);
    }
    return this._queuesByKey[key].enqueue(operation);
  }
}
