'use strict';

var util = require('util');
var Event = require('./Event');

function FDBVersionChangeEvent(type, parameters) {
    Event.call(this, type);

    parameters = parameters !== undefined ? parameters : {};
    this.oldVersion = parameters.oldVersion !== undefined ? parameters.oldVersion : 0;
    this.newVersion = parameters.newVersion !== undefined ? parameters.newVersion : null;

    this.toString = function () {
        return '[object IDBVersionChangeEvent]';
    };
}
util.inherits(FDBVersionChangeEvent, Event);

module.exports = FDBVersionChangeEvent;