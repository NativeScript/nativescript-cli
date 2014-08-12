global._ = require("underscore");
global.$injector = require("../lib/common/yok").injector;

process.on('exit', (code: number) => {
	require("fibers/future").assertNoFutureLeftBehind();
});
