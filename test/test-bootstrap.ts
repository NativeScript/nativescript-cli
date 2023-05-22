import * as shelljs from "shelljs";
import { use } from "chai";
import { ICliGlobal } from "../lib/common/definitions/cli-global";

shelljs.config.silent = true;
shelljs.config.fatal = true;

const cliGlobal = <ICliGlobal>(<unknown>global);

import * as _ from "lodash";
cliGlobal._ = _;
import { injector } from "../lib/common/yok";
cliGlobal.$injector = injector;

use(require("chai-as-promised"));

cliGlobal.$injector.register("analyticsService", {
	trackException: async (exception: any, message: string): Promise<void> => {
		// Intentionally left blank.
	},
});

import { PerformanceService, LoggerStub } from "./stubs";
cliGlobal.$injector.register("logger", LoggerStub);
cliGlobal.$injector.register("performanceService", PerformanceService);

// Converts the js callstack to typescript
import { installUncaughtExceptionListener } from "../lib/common/errors";
installUncaughtExceptionListener();
