import * as shelljs from "shelljs";
import { use } from "chai";

shelljs.config.silent = true;
shelljs.config.fatal = true;

const cliGlobal = <ICliGlobal>global;

cliGlobal._ = require("lodash");
// TODO: mocked injector
cliGlobal.$injector = require("../lib/common/yok").injector;

// Requiring colors will modify the prototype of String
// We need it as in some places we use <string>.<color>, which is undefined when colors is not required
// So we sometimes miss warnings in the tests as we receive "undefined".
require("colors");

use(require("chai-as-promised"));

// $injector.register("analyticsService", {
// 	trackException: () => { return Promise.resolve(); },
// 	checkConsent: () => { return Promise.resolve(); },
// 	trackFeature: () => { return Promise.resolve(); },
// 	// trackEventActionInGoogleAnalytics: (data: IEventActionData) => Promise.resolve(),
// 	trackInGoogleAnalytics: (data: IGoogleAnalyticsData) => Promise.resolve(),
// 	trackAcceptFeatureUsage: (settings: { acceptTrackFeatureUsage: boolean }) => Promise.resolve()
// });

import { PerformanceService, LoggerStub } from "./stubs";
$injector.register("logger", LoggerStub);
$injector.register("performanceService", PerformanceService);

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();
