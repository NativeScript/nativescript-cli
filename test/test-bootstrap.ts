import * as shelljs from "shelljs";
import { use } from "chai";

shelljs.config.silent = true;
shelljs.config.fatal = true;

const cliGlobal = <ICliGlobal>global;

cliGlobal._ = require("lodash");
cliGlobal.$injector = require("../lib/common/yok").injector;

// Requiring colors will modify the prototype of String
// We need it as in some places we use <string>.<color>, which is undefined when colors is not required
// So we sometimes miss warnings in the tests as we receive "undefined".
require("colors");

use(require("chai-as-promised"));

$injector.register("analyticsService", {
	trackException: async (exception: any, message: string): Promise<void> => {
		// Intentionally left blank.
	}
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();
