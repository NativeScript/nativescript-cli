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

	private static NPM_ANDROID_BRIDGE_NAME = "tns-android";

	public constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $npm: INodePackageManager) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.installNpmPackage(ProjectTemplatesService.NPM_DEFAULT_TEMPLATE_NAME);
	}

	public installAndroidFramework(where?: string): IFuture<string> {
		return this.installNpmPackage(ProjectTemplatesService.NPM_ANDROID_BRIDGE_NAME, where);
	}

	private installNpmPackage(packageName: string, where?: string): IFuture<string> {
		return (() => {
			try {
				this.$npm.load().wait();
				var location = where || npm.cache;
				this.$npm.install(location, packageName).wait();
			} catch (error) {
				this.$logger.debug(error);
				this.$errors.fail(ProjectTemplatesService.NPM_LOAD_FAILED);
			}

			return path.join(location, "node_modules", packageName);

		}).future<string>()();
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);