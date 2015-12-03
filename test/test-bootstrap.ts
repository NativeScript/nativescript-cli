import * as shelljs from "shelljs";
shelljs.config.silent = true;
global._ = require("lodash");
global.$injector = require("../lib/common/yok").injector;

$injector.register("analyticsService", {
	trackException: (): IFuture<void> => undefined
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();

process.on('exit', (code: number) => {
	require("fibers/future").assertNoFutureLeftBehind();
});
