///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");

export class AddLibraryCommand implements ICommand {
    constructor(private $platformService: IPlatformService,
                private $errors: IErrors,
                private $logger: ILogger) { }

    allowedParameters: ICommandParameter[] = [];

    execute(args: string[]): IFuture<void> {
        return (() => {
            var platform = args[0];
            var libraryPath = path.resolve(args[1]);
            this.$platformService.addLibrary(platform, libraryPath).wait();
            this.$logger.info(`Library ${libraryPath} was successfully added for ${platform} platform.`);
        }).future<void>()();
    }

    canExecute(args: string[]): IFuture<boolean> {
        if (args.length !== 2) {
            this.$errors.fail("This command needs two parameters.");
        }

        this.$platformService.validatePlatformInstalled(args[0]);
        return Future.fromResult(true);
    }
}
$injector.registerCommand("library|add", AddLibraryCommand);