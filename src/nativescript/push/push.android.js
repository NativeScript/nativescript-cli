"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var es6_promise_1 = require("es6-promise");
var utils_1 = require("kinvey-js-sdk/dist/utils");
var errors_1 = require("kinvey-js-sdk/dist/errors");
var common_1 = require("./common");
var PushPlugin;
try {
    PushPlugin = require('nativescript-push-notifications');
}
catch (e) {
}
var AndroidPush = (function (_super) {
    __extends(AndroidPush, _super);
    function AndroidPush() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AndroidPush.prototype._registerWithPushPlugin = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var config = options.android || {};
        return new es6_promise_1.Promise(function (resolve, reject) {
            if (utils_1.isDefined(PushPlugin) === false) {
                return reject(new errors_1.KinveyError('NativeScript Push Plugin is not installed.', 'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
                    + ' setting up your project.'));
            }
            PushPlugin.register(config, resolve, reject);
            PushPlugin.onMessageReceived(function (data) {
                _this.emit('notification', data);
            });
        });
    };
    AndroidPush.prototype._unregisterWithPushPlugin = function (options) {
        if (options === void 0) { options = {}; }
        return new es6_promise_1.Promise(function (resolve, reject) {
            if (utils_1.isDefined(PushPlugin) === false) {
                return reject(new errors_1.KinveyError('NativeScript Push Plugin is not installed.', 'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
                    + ' setting up your project.'));
            }
            PushPlugin.unregister(resolve, reject, options);
        });
    };
    return AndroidPush;
}(common_1.PushCommon));
var Push = new AndroidPush();
exports.Push = Push;
