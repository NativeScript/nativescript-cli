'use strict';

var InvalidStateError = require('./errors/InvalidStateError');

function stop(event, listener) {
    return event._stopImmediatePropagation ||
           (event.eventPhase === event.CAPTURING_PHASE && listener.capture === false) ||
           (event.eventPhase === event.BUBBLING_PHASE && listener.capture === true);
}

// http://www.w3.org/TR/dom/#concept-event-listener-invoke
function invokeEventListeners(event, obj) {
    event.currentTarget = obj;

    obj._listeners.forEach(function (listener) {
        if (event.type !== listener.type || stop(event, listener)) {
            return;
        }

        listener.callback.call(event.currentTarget, event);
    });

    if (event.currentTarget['on' + event.type]) {
        var listener = {
            type: event.type,
            callback: event.currentTarget['on' + event.type],
            capture: false
        };
        if (stop(event, listener)) {
            return;
        }
        listener.callback.call(event.currentTarget, event);
    }
}

module.exports = function () {
    this._listeners = [];

    this.addEventListener = function (type, callback, capture) {
        if (callback === null) { return; }
        capture = capture !== undefined ? capture : false;

        this._listeners.push({
            type: type,
            callback: callback,
            capture: capture
        });
    };

    this.removeEventListener = function (type, callback, capture) {
        capture = capture !== undefined ? capture : false;

        var i = this._listeners.findIndex(function (listener) {
            return listener.type === type &&
                   listener.callback === callback &&
                   listener.capture === capture;
        });

        this._listeners.splice(i, 1);
    };

    // http://www.w3.org/TR/dom/#dispatching-events
    this.dispatchEvent = function (event) {
        if (event._dispatch || !event._initialized) {
            throw new InvalidStateError('The object is in an invalid state.');
        }
        event._isTrusted = false;

        event._dispatch = true;
        event.target = this;
// NOT SURE WHEN THIS SHOULD BE SET        event._eventPath = [];

        event.eventPhase = event.CAPTURING_PHASE;
        event._eventPath.forEach(function (obj) {
            if (!event._stopPropagation) {
                invokeEventListeners(event, obj);
            }
        });

        event.eventPhase = event.AT_TARGET;
        if (!event._stopPropagation) {
            invokeEventListeners(event, event.target);
        }

        if (event.bubbles) {
            event._eventPath.reverse();
            event.eventPhase = event.BUBBLING_PHASE;
            event._eventPath.forEach(function (obj) {
                if (!event._stopPropagation) {
                    invokeEventListeners(event, obj);
                }
            });
        }

        event._dispatch = false;
        event.eventPhase = event.NONE;
        event.currentTarget = null;

        if (event._canceled) {
            return false;
        }
        return true;
    };
};