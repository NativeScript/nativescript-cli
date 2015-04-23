///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");

export class LogcatPrinter implements Mobile.ILogcatPrinter {
	constructor(private $logger: ILogger) { }

	public print(line: string): void {
		this.$logger.out(line);
	}

}
$injector.register("logcatPrinter", LogcatPrinter);