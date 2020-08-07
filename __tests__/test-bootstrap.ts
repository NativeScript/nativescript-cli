/// <reference path="../lib/common/definitions/cli-global.d.ts" />
import * as shelljs from "shelljs";
import { use } from "chai";

shelljs.config.silent = true;
shelljs.config.fatal = true;

const cliGlobal = <ICliGlobal><any>global;

import * as _ from 'lodash';
cliGlobal._ = _;
import { injector } from '../lib/common/yok';
cliGlobal.$injector = injector;

// Requiring colors will modify the prototype of String
// We need it as in some places we use <string>.<color>, which is undefined when colors is not required
// So we sometimes miss warnings in the tests as we receive "undefined".
require("colors");

use(require("chai-as-promised"));

cliGlobal.$injector.register("analyticsService", {
	trackException: async (exception: any, message: string): Promise<void> => {
		// Intentionally left blank.
	}
});

import { PerformanceService, LoggerStub } from "./stubs";
cliGlobal.$injector.register("logger", LoggerStub);
cliGlobal.$injector.register("performanceService", PerformanceService);

// Converts the js callstack to typescript
import { installUncaughtExceptionListener } from "../lib/common/errors";
installUncaughtExceptionListener();
