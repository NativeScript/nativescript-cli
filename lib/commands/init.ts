///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");

export class InitCommand implements ICommand {
	constructor(private $initService: IInitService) { }
		
	public allowedParameters: ICommandParameter[] = [];
	public enableHooks = false;
	
	public execute(args: string[]): IFuture<void> {
		return this.$initService.initialize();
	}
}
$injector.registerCommand("init", InitCommand);