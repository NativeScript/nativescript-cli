///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");

export class AddLibraryCommand implements ICommand {
    constructor(private $platformService: IPlatformService,
                private $errors: IErrors,
                private $logger: ILogger,
                private $fs: IFileSystem) { }

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
        return (() => {
            if (args.length !== 2) {
                this.$errors.fail("This command needs two parameters.");
            }
  
            let platform = args[0]; 
            let platformLowerCase = platform.toLowerCase(); 
            let libraryPath = path.resolve(args[1]);
            if(platformLowerCase === "android") {
                if(!this.$fs.exists(path.join(libraryPath, "project.properties")).wait()) {
                    let files = this.$fs.enumerateFilesInDirectorySync(libraryPath);
                    if(!_.any(files, file => path.extname(file) === ".jar")) {
                        this.$errors.failWithoutHelp("Invalid library path. Ensure that the library path is the file path to a directory containing one or more `*.jar` files or to a directory containing the `project.properties` files.");
                    }
                }
            } else if(platformLowerCase === "ios") {
                if(path.extname(libraryPath) !== ".framework") {
                    this.$errors.failWithoutHelp("Invalid library path. Ensure that the library path is a Cocoa Touch Framework with all build architectures enabled.");
                }
            }
            
            this.$platformService.validatePlatformInstalled(args[0]);
            return true;
        }).future<boolean>()();
    }
}
$injector.registerCommand("library|add", AddLibraryCommand);