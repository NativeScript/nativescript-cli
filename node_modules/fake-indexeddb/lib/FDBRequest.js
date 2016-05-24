'use strict';

var util = require('util');
var EventTarget = require('./EventTarget');

function FDBRequest() {
    EventTarget.call(this);

    this.result = null;
    this.error = null;
    this.source = null;
    this.transaction = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;

    this.toString = function () {
        return '[object IDBRequest]';
    };
}
util.inherits(FDBRequest, EventTarget);

module.exports = FDBRequest;