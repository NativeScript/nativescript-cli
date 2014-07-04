///<reference path=".d.ts"/>

import Fiber = require("fibers");
import Future = require("fibers/future");
import path = require("path");

require("./bootstrap");
require("./options");

import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

$injector.register("config", {"CI_LOGGER": false});

var dispatcher = $injector.resolve("dispatcher");
dispatcher.runMainFiber();