///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import shell = require("shelljs");
import npm = require("npm");
var options = require("./../options");
var helpers = require("./../common/helpers");
import Future = require("fibers/future");

export class ProjectTemplatesService implements IProjectTemplatesService {
	private static NPM_DEFAULT_TEMPLATE_NAME = "tns-template-hello-world";
	private static NPM_LOAD_FAILED = "Failed to retrieve nativescript hello world application. Please try again a little bit later.";

	public constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $npm: INodePackageManager) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.getDefaultTemplatePath();
	}

	private getDefaultTemplatePath(): IFuture<string> {
		return (() => {
			try {
				this.$npm.load().wait();
				this.$npm.install(npm.cache, ProjectTemplatesService.NPM_DEFAULT_TEMPLATE_NAME).wait();
			} catch (error) {
				this.$logger.debug(error);
				this.$errors.fail(ProjectTemplatesService.NPM_LOAD_FAILED);
			}

			return path.join(npm.cache, "node_modules", ProjectTemplatesService.NPM_DEFAULT_TEMPLATE_NAME);
		}).future<string>()();
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);