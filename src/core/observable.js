import Promise from 'es6-promise';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { rxSubscriber } from 'rxjs/symbol/rxSubscriber';
import isFunction from 'lodash/isFunction';
import { isDefined, isPromiseLike } from './utils';

/**
 * @private
 */
const emptyObserver = {
  closed: true,
  next() { /* noop */ },
  error(err) { throw err; },
  complete() { /* noop */ },
  status() { /* noop */ },
  presence() { /* noop */ }
};

/**
 * @private
 */
class SafeSubscriber extends Subscriber {
  constructor(_parentSubscriber, observerOrNext, error, complete, status, presence) {
    super();
    let next;
    let context = this;
    this._parentSubscriber = _parentSubscriber;

    if (isFunction(observerOrNext)) {
      next = observerOrNext;
    } else if (observerOrNext) {
      next = observerOrNext.next;
      error = observerOrNext.error;
      complete = observerOrNext.complete;
      if (observerOrNext !== emptyObserver) {
        context = Object.create(observerOrNext);
        if (isFunction(context.unsubscribe)) {
          this.add(context.unsubscribe.bind(context));
        }
        context.unsubscribe = this.unsubscribe.bind(this);
      }
    }

    this._context = context;
    this._next = next;
    this._error = error;
    this._complete = complete;
    this._status = status;
    this._presence = presence;
  }

  next(value) {
    if (!this.isStopped && this._next) {
      const { _parentSubscriber } = this;
      if (!_parentSubscriber.syncErrorThrowable) {
        this.__tryOrUnsub(this._next, value);
      } else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
        this.unsubscribe();
      }
    }
  }

  error(err) {
    if (!this.isStopped) {
      const { _parentSubscriber } = this;
      if (this._error) {
        if (!_parentSubscriber.syncErrorThrowable) {
          this.__tryOrUnsub(this._error, err);
          this.unsubscribe();
        } else {
          this.__tryOrSetError(_parentSubscriber, this._error, err);
          this.unsubscribe();
        }
      } else if (!_parentSubscriber.syncErrorThrowable) {
        this.unsubscribe();
        throw err;
      } else {
        _parentSubscriber.syncErrorValue = err;
        _parentSubscriber.syncErrorThrown = true;
        this.unsubscribe();
      }
    }
  }

  complete() {
    if (!this.isStopped) {
      const { _parentSubscriber } = this;
      if (this._complete) {
        const wrappedComplete = () => this._complete.call(this._context);

        if (!_parentSubscriber.syncErrorThrowable) {
          this.__tryOrUnsub(wrappedComplete);
          this.unsubscribe();
        } else {
          this.__tryOrSetError(_parentSubscriber, wrappedComplete);
          this.unsubscribe();
        }
      } else {
        this.unsubscribe();
      }
    }
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

  __tryOrUnsub(fn, value) {
    try {
      fn.call(this._context, value);
    } catch (err) {
      this.unsubscribe();
      throw err;
    }
  }

  __tryOrSetError(parent, fn, value) {
    try {
      fn.call(this._context, value);
    } catch (err) {
      parent.syncErrorValue = err;
      parent.syncErrorThrown = true;
      return true;
    }
    return false;
  }

  _unsubscribe() {
    const { _parentSubscriber } = this;
    this._context = null;
    this._parentSubscriber = null;
    _parentSubscriber.unsubscribe();
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
        this.destination = new SafeSubscriber(this, observerOrNext, error, complete, status, presence);
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
    if (observerOrNext instanceof KinveySubscriber) {
      return observerOrNext;
    }

    if (observerOrNext[rxSubscriber]) {
      return observerOrNext[rxSubscriber]();
    }
  }

  if (!observerOrNext && !error && !complete && !status && !presence) {
    return new KinveySubscriber(emptyObserver);
  }

  return new KinveySubscriber(observerOrNext, error, complete, status, presence);
}


/**
 * @private
 */
export class KinveyObservable extends Observable {
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

export function wrapInObservable(promiseGeneratorOrPromise, completeAfter = true) {
  const argIsPromise = isPromiseLike(promiseGeneratorOrPromise);

  const stream = KinveyObservable.create((observer) => {
    let promise;
    if (argIsPromise) {
      promise = promiseGeneratorOrPromise;
    } else {
      promise = promiseGeneratorOrPromise(observer);
    }

    promise
      .then((result) => {
        if (argIsPromise) {
          observer.next(result);
        }
        if (completeAfter) {
          observer.complete();
        }
      })
      .catch(err => observer.error(err));
  });

  return stream;
}
