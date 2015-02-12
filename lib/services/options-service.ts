///<reference path="../.d.ts"/>
"use strict";

import options = require("../common/options");

export class OptionsService implements IOptionsService {
	public getKnownOptions(): string[]{
		return Object.keys(options.knownOpts);
	}
}
$injector.register("optionsService", OptionsService);
