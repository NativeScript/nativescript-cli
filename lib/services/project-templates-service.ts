///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import shell = require("shelljs");
import npm = require("npm");
var options = require("./../options");
var helpers = require("./../common/helpers");
import Future = require("fibers/future");

export class ProjectTemplatesService implements IProjectTemplatesService {
	private static NPM_DEFAULT_TEMPLATE_URL = "http://registry.npmjs.org/tns-template-hello-world/-/tns-template-hello-world-0.1.0.tgz";
	private static DEFAULT_TEMPLATE_DOWNLOAD_FAILED = "Failed to retrieve nativescript hello world application. Please try again a little bit later.";

	public constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $nodePackageManager: INodePackageManager) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.getDefaultTemplatePath();
	}

	private getDefaultTemplatePath(): IFuture<string> {
		return (() => {
			try {
				this.$nodePackageManager.load({"cache": path.join(options["profile-dir"], "npm_cache")}).wait();
				var info = this.$nodePackageManager.executeCommand("cache", ['add', ProjectTemplatesService.NPM_DEFAULT_TEMPLATE_URL]).wait();
			} catch (error) {
				this.$logger.debug(error);
				this.$errors.fail(ProjectTemplatesService.DEFAULT_TEMPLATE_DOWNLOAD_FAILED);
			}

			var packagePath =  path.join(npm.cache, info.name, info.version);
			var packageFileName = path.join(packagePath, "package.tgz");

			this.$fs.unzipTarball(packageFileName, packagePath).wait();

			return path.join(packagePath, "package");
		}).future<string>()();
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);