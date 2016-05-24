"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observable_1 = require('../Observable');
var MulticastObservable = (function (_super) {
    __extends(MulticastObservable, _super);
    function MulticastObservable(source, connectable, selector) {
        _super.call(this);
        this.source = source;
        this.connectable = connectable;
        this.selector = selector;
    }
    MulticastObservable.prototype._subscribe = function (subscriber) {
        var _a = this, selector = _a.selector, connectable = _a.connectable;
        var subscription = selector(connectable).subscribe(subscriber);
        subscription.add(connectable.connect());
        return subscription;
    };
    return MulticastObservable;
}(Observable_1.Observable));
exports.MulticastObservable = MulticastObservable;
//# sourceMappingURL=MulticastObservable.js.map