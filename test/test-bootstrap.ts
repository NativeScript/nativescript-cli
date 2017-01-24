import * as shelljs from "shelljs";
import { use } from "chai";

shelljs.config.silent = true;
shelljs.config.fatal = true;

const cliGlobal = <ICliGlobal>global;

cliGlobal._ = require("lodash");
cliGlobal.$injector = require("../lib/common/yok").injector;

use(require("chai-as-promised"));

$injector.register("analyticsService", {
	trackException: (): { wait(): void } => {
		return {
			wait: () => undefined
		};
	}
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();
