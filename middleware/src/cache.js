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
var request_1 = require("kinvey-js-sdk/dist/request");
var storage_1 = require("kinvey-js-sdk/dist/request/src/middleware/src/storage");
var storage_2 = require("../../storage");
var Storage = (function (_super) {
    __extends(Storage, _super);
    function Storage(name) {
        return _super.call(this, name) || this;
    }
    Storage.prototype.loadAdapter = function () {
        return storage_2.SQLite.load(this.name);
    };
    return Storage;
}(storage_1.default));
var NativeScriptCacheMiddleware = (function (_super) {
    __extends(NativeScriptCacheMiddleware, _super);
    function NativeScriptCacheMiddleware() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NativeScriptCacheMiddleware.prototype.loadStorage = function (name) {
        return new Storage(name);
    };
    return NativeScriptCacheMiddleware;
}(request_1.CacheMiddleware));
exports.NativeScriptCacheMiddleware = NativeScriptCacheMiddleware;
