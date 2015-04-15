import Fiber = require("fibers");
import Future = require("fibers/future");
import errors = require("./common/errors");

export function run(action: Function) {
	var fiber = Fiber(() => {
		errors.installUncaughtExceptionListener();
		action();
		$injector.dispose();
		Future.assertNoFutureLeftBehind();
	});

	fiber.run();
}

