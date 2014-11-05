///<reference path=".d.ts"/>
"use strict";

export class PlatformCommandParameter implements ICommandParameter {
	constructor(private $platformService: IPlatformService) { }
	mandatory = true;
	validate(value: string): IFuture<boolean> {
		return (() => {
			this.$platformService.validatePlatformInstalled(value);
			return true;
		}).future<boolean>()();
	}
}
$injector.register("platformCommandParameter", PlatformCommandParameter);