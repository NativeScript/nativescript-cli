///<reference path=".d.ts"/>
"use strict";
import path = require("path");
require("./bootstrap");

import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

var dispatcher = $injector.resolve("dispatcher");
dispatcher.runMainFiber();

