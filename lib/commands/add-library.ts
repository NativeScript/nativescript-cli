///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");

export class AddLibraryCommand implements ICommand {
    constructor(private $platformService: IPlatformService,
                private $errors: IErrors) { }

    allowedParameters: ICommandParameter[] = [];

    execute(args: string[]): IFuture<void> {
        var platform = args[0];
        var libraryPath = path.resolve(args[1]);
        return this.$platformService.addLibrary(platform, libraryPath);
    }

    canExecute(args: string[]): IFuture<boolean> {
        if (args.length != 2) {
            this.$errors.fail("This command needs two parameters.");
        }

        this.$platformService.validatePlatformInstalled(args[0]);
        return Future.fromResult(true);
    }
}
$injector.registerCommand("library|add", AddLibraryCommand);