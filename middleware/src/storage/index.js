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
var storage_1 = require("kinvey-js-sdk/dist/request/src/middleware/src/storage");
var sqlite_1 = require("./src/sqlite");
var Storage = (function (_super) {
    __extends(Storage, _super);
    function Storage(name) {
        return _super.call(this, name) || this;
    }
    Storage.prototype.loadAdapter = function () {
        return sqlite_1.default.load(this.name);
    };
    return Storage;
}(storage_1.default));
exports.Storage = Storage;
