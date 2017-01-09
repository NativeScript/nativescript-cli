import * as shelljs from "shelljs";
shelljs.config.silent = true;
shelljs.config.fatal = true;
global._ = require("lodash");
global.$injector = require("../lib/common/yok").injector;
import { use } from "chai";
use(require("chai-as-promised"));

$injector.register("analyticsService", {
	trackException: (): {wait(): void} => {
		return {
			wait: () => undefined
		};
	}
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();
