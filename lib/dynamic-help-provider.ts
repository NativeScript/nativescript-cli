///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");

export class DynamicHelpProvider implements IDynamicHelpProvider {
	public isProjectType(args: string[]): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public getLocalVariables(options: { isHtml: boolean }): IFuture<IDictionary<any>> {
		let localVariables: IDictionary<any> = {};
		return Future.fromResult(localVariables);
	}
}
$injector.register("dynamicHelpProvider", DynamicHelpProvider);
