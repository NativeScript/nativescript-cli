///<reference path="../.d.ts"/>
"use strict";

export class DebugPlatformCommand implements ICommand {
	constructor(private debugService: IDebugService) { }

	execute(args: string[]): IFuture<void> {
		return this.debugService.debug();
	}

	allowedParameters: ICommandParameter[] = [];
}

export class DebugIOSCommand extends DebugPlatformCommand {
	constructor(private $iOSDebugService: IDebugService) {
		super($iOSDebugService);
	}
}
$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor(private $androidDebugService: IDebugService) {
		super($androidDebugService);
	}
}
$injector.registerCommand("debug|android", DebugAndroidCommand);
