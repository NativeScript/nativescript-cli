///<reference path="../.d.ts"/>
"use strict";
import Future = require("fibers/future");

export class CommandsServiceProvider implements ICommandsServiceProvider {
	public getDynamicCommands(): IFuture<string[]> {
		return Future.fromResult([]);
	}

	public generateDynamicCommands(): IFuture<void> {
		return Future.fromResult();
	}

	public registerDynamicSubCommands(): void {

	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);