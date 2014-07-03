///<reference path=".d.ts"/>

import Fiber = require("fibers");

require("./bootstrap");

var fiber = Fiber(() => {
});
global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();