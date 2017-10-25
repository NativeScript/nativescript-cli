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
var events_1 = require("events");
var platform_1 = require("platform");
var client_1 = require("kinvey-js-sdk/dist/client");
var errors_1 = require("kinvey-js-sdk/dist/errors");
var utils_1 = require("kinvey-js-sdk/dist/utils");
var entity_1 = require("kinvey-js-sdk/dist/entity");
var request_1 = require("kinvey-js-sdk/dist/request");
var PushCommon = (function (_super) {
    __extends(PushCommon, _super);
    function PushCommon() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PushCommon.prototype, "client", {
        get: function () {
            if (utils_1.isDefined(this._client) === false) {
                return client_1.default.sharedInstance();
            }
            return this._client;
        },
        set: function (client) {
            if (utils_1.isDefined(client) && (client instanceof client_1.default) === false) {
                throw new Error('client must be an instance of Client.');
            }
            this._client = client;
        },
        enumerable: true,
        configurable: true
    });
    PushCommon.prototype.onNotification = function (listener) {
        return this.on('notification', listener);
    };
    PushCommon.prototype.onceNotification = function (listener) {
        return this.once('notification', listener);
    };
    PushCommon.prototype.register = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return this._registerWithPushPlugin(options)
            .then(function (token) {
            if (utils_1.isDefined(token) === false) {
                throw new errors_1.KinveyError('Unable to retrieve the device token to register this device for push notifications.');
            }
            return _this._registerWithKinvey(token, options);
        })
            .then(function (token) {
            return _this._saveTokenToCache(token, options);
        });
    };
    PushCommon.prototype.unregister = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return this._unregisterWithPushPlugin(options)
            .then(function () {
            return _this._getTokenFromCache(options);
        })
            .then(function (token) {
            if (utils_1.isDefined(token) === false) {
                throw new errors_1.KinveyError('Unable to retrieve the device token to unregister this device for push notifications.');
            }
            return _this._unregisterWithKinvey(token, options);
        })
            .then(function () {
            return _this._deleteTokenFromCache(options);
        });
    };
    PushCommon.prototype._registerWithPushPlugin = function (options) {
        if (options === void 0) { options = {}; }
        return es6_promise_1.Promise.reject(new errors_1.KinveyError('Unable to register for push notifications.'));
    };
    PushCommon.prototype._unregisterWithPushPlugin = function (options) {
        if (options === void 0) { options = {}; }
        return es6_promise_1.Promise.reject(new errors_1.KinveyError('Unable to unregister for push notifications.'));
    };
    PushCommon.prototype._registerWithKinvey = function (token, options) {
        if (options === void 0) { options = {}; }
        var activeUser = entity_1.User.getActiveUser(this.client);
        if (utils_1.isDefined(activeUser) === false) {
            return es6_promise_1.Promise.reject(new errors_1.KinveyError('Unable to register this device for push notifications.', 'You must login a user.'));
        }
        var request = new request_1.KinveyRequest({
            method: request_1.RequestMethod.POST,
            url: this.client.apiHostname + "/push/" + this.client.appKey + "/register-device",
            authType: activeUser ? request_1.AuthType.Session : request_1.AuthType.Master,
            data: {
                platform: platform_1.device.os.toLowerCase(),
                framework: 'nativescript',
                deviceId: token
            },
            timeout: options.timeout,
            client: this.client
        });
        return request.execute().then(function () { return token; });
    };
    PushCommon.prototype._unregisterWithKinvey = function (token, options) {
        if (options === void 0) { options = {}; }
        var activeUser = entity_1.User.getActiveUser(this.client);
        if (utils_1.isDefined(activeUser) === false) {
            return es6_promise_1.Promise.reject(new errors_1.KinveyError('Unable to unregister this device for push notifications.', 'You must login a user.'));
        }
        var request = new request_1.KinveyRequest({
            method: request_1.RequestMethod.POST,
            url: this.client.apiHostname + "/push/" + this.client.appKey + "/unregister-device",
            authType: utils_1.isDefined(activeUser) ? request_1.AuthType.Session : request_1.AuthType.Master,
            data: {
                platform: platform_1.device.os.toLowerCase(),
                framework: 'nativescript',
                deviceId: token
            },
            timeout: options.timeout,
            client: this.client
        });
        return request.execute().then(function (response) { return response.data; });
    };
    PushCommon.prototype._getTokenFromCache = function (options) {
        if (options === void 0) { options = {}; }
        var activeUser = entity_1.User.getActiveUser(this.client);
        if (utils_1.isDefined(activeUser) === false) {
            throw new errors_1.KinveyError('Unable to retrieve device token.', 'You must login a user.');
        }
        var request = new request_1.CacheRequest({
            method: request_1.RequestMethod.GET,
            url: this.client.apiHostname + "/appdata/" + this.client.appKey + "/__device/" + activeUser._id,
            client: this.client
        });
        return request.execute()
            .catch(function (error) {
            if (error instanceof errors_1.NotFoundError) {
                return {};
            }
            throw error;
        })
            .then(function (response) { return response.data; })
            .then(function (device) {
            if (utils_1.isDefined(device)) {
                return device.token;
            }
            return null;
        });
    };
    PushCommon.prototype._saveTokenToCache = function (token, options) {
        if (options === void 0) { options = {}; }
        var activeUser = entity_1.User.getActiveUser(this.client);
        if (utils_1.isDefined(activeUser) === false) {
            throw new errors_1.KinveyError('Unable to save device token.', 'You must login a user.');
        }
        var request = new request_1.CacheRequest({
            method: request_1.RequestMethod.PUT,
            url: this.client.apiHostname + "/appdata/" + this.client.appKey + "/__device",
            data: {
                userId: activeUser._id,
                token: token
            },
            client: this.client
        });
        return request.execute().then(function () { return token; });
    };
    PushCommon.prototype._deleteTokenFromCache = function (options) {
        if (options === void 0) { options = {}; }
        var activeUser = entity_1.User.getActiveUser(this.client);
        if (utils_1.isDefined(activeUser) === false) {
            throw new errors_1.KinveyError('Unable to delete device token.', 'You must login a user.');
        }
        var request = new request_1.CacheRequest({
            method: request_1.RequestMethod.DELETE,
            url: this.client.apiHostname + "/appdata/" + this.client.appKey + "/__device/" + activeUser._id,
            client: this.client
        });
        return request.execute()
            .catch(function (error) {
            if (error instanceof errors_1.NotFoundError) {
                return {};
            }
            throw error;
        })
            .then(function () { return null; });
    };
    return PushCommon;
}(events_1.EventEmitter));
exports.PushCommon = PushCommon;
