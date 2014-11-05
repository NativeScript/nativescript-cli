///<reference path="../.d.ts"/>
"use strict";
import osenv = require("osenv");
import path = require("path");
import util = require("util");

export class PostInstallCommand implements ICommand {

	constructor(private $autoCompletionService: IAutoCompletionService,
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) { }

	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(process.platform !== "win32") {
				this.$fs.chmod(this.$staticConfig.adbFilePath, "0777").wait();
			}

			this.$autoCompletionService.enableAutoCompletion().wait();
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("dev-post-install", PostInstallCommand);