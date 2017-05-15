import Promise from 'es6-promise';
import { Observable } from 'rxjs/Observable';
import { Subscriber, SafeSubscriber } from 'rxjs/Subscriber';
import { rxSubscriber as rxSubscriberSymbol } from 'rxjs/symbol/rxSubscriber';
import { empty as emptyObserver } from 'rxjs/Observer';

import { isDefined } from 'src/utils';

/**
 * @private
 */
class KinveySafeSubscriber extends SafeSubscriber {
  constructor(_parentSubscriber, observerOrNext, error, complete, status, presence) {
    super(_parentSubscriber, observerOrNext, error, complete);
    this._status = status;
    this._presence = presence;
  }

  status(value) {
    if (!this.isStopped && this._status) {
      const { _parentSubscriber } = this;
      if (!_parentSubscriber.syncErrorThrowable) {
        this.__tryOrUnsub(this._status, value);
      } else if (this.__tryOrSetError(_parentSubscriber, this._status, value)) {
        this.unsubscribe();
      }
    }
  }

  presence(value) {
    if (!this.isStopped && this._presence) {
      const { _parentSubscriber } = this;
      if (!_parentSubscriber.syncErrorThrowable) {
        this.__tryOrUnsub(this._presence, value);
      } else if (this.__tryOrSetError(_parentSubscriber, this._presence, value)) {
        this.unsubscribe();
      }
    }
  }
}

/**
 * @private
 */
class KinveySubscriber extends Subscriber {
  constructor(observerOrNext, error, complete, status, presence) {
    super(observerOrNext, error, complete);

    switch (arguments.length) {
      case 0:
        this.destination = emptyObserver;
        break;
      case 1:
        if (isDefined(observerOrNext) === false) {
          this.destination = emptyObserver;
          break;
        }
        if (typeof observerOrNext === 'object') {
          if (observerOrNext instanceof Subscriber) {
            this.destination = observerOrNext;
            this.destination.add(this);
          } else {
            this.syncErrorThrowable = true;
            this.destination = new SafeSubscriber(this, observerOrNext);
          }
          break;
        }
      default:
        this.syncErrorThrowable = true;
        this.destination = new KinveySafeSubscriber(this, observerOrNext, error, complete, status, presence);
        break;
    }
  }

  status(value) {
    if (!this.isStopped) {
      this._status(value);
    }
  }

  presence(value) {
    if (!this.isStopped) {
      this._presence(value);
    }
  }

  _status(value) {
    this.destination.status(value);
  }

  _presence(value) {
    this.destination.presence(value);
  }
}

/**
 * @private
 */
function toSubscriber(observerOrNext, error, complete, status, presence) {
  if (observerOrNext) {
    if (observerOrNext instanceof Subscriber) {
      return observerOrNext;
    }

    if (observerOrNext[rxSubscriberSymbol]) {
      return observerOrNext[rxSubscriberSymbol]();
    }
  }

  if (!observerOrNext && !error && !complete) {
    return new Subscriber(emptyObserver);
  }

  return new KinveySubscriber(observerOrNext, error, complete, status, presence);
}


/**
 * @private
 */
export default class KinveyObservable extends Observable {
  subscribe(observerOrNext, error, complete, status, presence) {
    const { operator } = this;
    const sink = toSubscriber(observerOrNext, error, complete, status, presence);

    if (operator) {
      operator.call(sink, this.source);
    } else {
      sink.add(this._trySubscribe(sink));
    }

    if (sink.syncErrorThrowable) {
      sink.syncErrorThrowable = false;
      if (sink.syncErrorThrown) {
        throw sink.syncErrorValue;
      }
    }

    return sink;
  }

  toPromise() {
    return new Promise((resolve, reject) => {
      let value;
      this.subscribe((v) => {
        value = v;
      }, reject, () => {
        resolve(value);
      });
    });
  }

  static create(subscriber) {
    return new KinveyObservable(subscriber);
  }
}
