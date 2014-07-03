global._ = require("underscore");
global.$injector = require("./common/lib/yok").injector;

$injector.require("nativescript-cli", "./nativescript-cli");
