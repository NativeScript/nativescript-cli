///<reference path="../.d.ts"/>
"use strict";

import helpers = require("./../common/helpers");
import util = require("util")

export class DebugCommand implements ICommand {
    constructor(private $platformService: IPlatformService,
        private $platformCommandParameter: ICommandParameter) { }

    execute(args: string[]): IFuture<void> {
        return this.$platformService.debugPlatform(args[0]);
    }

    allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("debug", DebugCommand);
 