/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');

import ProjectServiceLib = require("../lib/services/project-service");
import ProjectDataServiceLib = require("../lib/services/project-data-service");
import ProjectHelperLib = require("../lib/common/project-helper");
import StaticConfigLib = require("../lib/config");
import NpmLib = require("../lib/node-package-manager");
import HttpClientLib = require("../lib/common/http-client");
import fsLib = require("../lib/common/file-system");

import path = require("path");
import temp = require("temp");
import util = require("util");
import helpers = require("../lib/common/helpers");

var assert = require("chai").assert;
var options: any = require("./../lib/options");
var mockProjectNameValidator = {
	validate: () => { return true; }
};

temp.track();

class ProjectIntegrationTest {
	private testInjector: IInjector;

	constructor() {
		this.createTestInjector();
	}

	public createProject(projectName: string): IFuture<void> {
		var projectService = this.testInjector.resolve("projectService");
		return projectService.createProject(projectName);
	}

	public getDefaultTemplatePath(): IFuture<string> {
		return (() => {
			var npm = this.testInjector.resolve("npm");
			var fs = this.testInjector.resolve("fs");

			var defaultTemplatePackageName = "tns-template-hello-world";
			var cacheRoot = npm.getCacheRootPath().wait();
			var defaultTemplatePath = path.join(cacheRoot, defaultTemplatePackageName);
			var latestVersion = npm.getLatestVersion(defaultTemplatePackageName).wait();

			if(!fs.exists(path.join(defaultTemplatePath, latestVersion)).wait()) {
				npm.addToCache(defaultTemplatePackageName, latestVersion).wait();
			}
			if(!fs.exists(path.join(defaultTemplatePath, latestVersion, "package", "app")).wait()) {
				npm.cacheUnpack(defaultTemplatePackageName, latestVersion).wait();
			}

			return path.join(defaultTemplatePath, latestVersion, "package");
		}).future<string>()();
	}

	public assertProject(tempFolder: string, projectName: string, appId: string): IFuture<void> {
		return (() => {
			var fs = this.testInjector.resolve("fs");
			var projectDir = path.join(tempFolder, projectName);
			var appDirectoryPath = path.join(projectDir, "app");
			var platformsDirectoryPath = path.join(projectDir, "platforms");
			var tnsProjectFilePath = path.join(projectDir, ".tnsproject");

			assert.isTrue(fs.exists(appDirectoryPath).wait());
			assert.isTrue(fs.exists(platformsDirectoryPath).wait());
			assert.isTrue(fs.exists(tnsProjectFilePath).wait());

			assert.isFalse(fs.isEmptyDir(appDirectoryPath).wait());
			assert.isTrue(fs.isEmptyDir(platformsDirectoryPath).wait());

			var actualAppId = fs.readJson(tnsProjectFilePath).wait().id;
			var expectedAppId = appId;
			assert.equal(actualAppId, expectedAppId);

			var actualFiles = helpers.enumerateFilesInDirectorySync(options["copy-from"]);
			var expectedFiles = helpers.enumerateFilesInDirectorySync(appDirectoryPath);

			assert.equal(actualFiles.length, expectedFiles.length);
			_.each(actualFiles, file => {
				var relativeToProjectDir = helpers.getRelativeToRootPath(options["copy-from"], file);
				assert.isTrue(fs.exists(path.join(appDirectoryPath, relativeToProjectDir)).wait());
			});
		}).future<void>()();
	}

	public dispose(): void {
		this.testInjector = undefined;
	}

	private createTestInjector(): void {
		this.testInjector = new yok.Yok();

		this.testInjector.register("errors", stubs.ErrorsStub);
		this.testInjector.register('logger', stubs.LoggerStub);
		this.testInjector.register("projectService", ProjectServiceLib.ProjectService);
		this.testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
		this.testInjector.register("projectTemplatesService", stubs.ProjectTemplatesService);
		this.testInjector.register("projectNameValidator", mockProjectNameValidator);

		this.testInjector.register("fs", fsLib.FileSystem);
		this.testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
		this.testInjector.register("staticConfig", StaticConfigLib.StaticConfig);

		this.testInjector.register("npm", NpmLib.NodePackageManager);
		this.testInjector.register("httpClient", HttpClientLib.HttpClient);
		this.testInjector.register("config", {});
	}
}

describe("Project Service Tests", () => {
	describe("project service integration tests", () => {
		it("creates valid project from default template", () => {
			var	projectIntegrationTest = new ProjectIntegrationTest();
			var tempFolder = temp.mkdirSync("project");
			var projectName = "myapp";

			options.path = tempFolder;
			options["copy-from"] = projectIntegrationTest.getDefaultTemplatePath().wait();

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp").wait();
		});
		it("creates valid project with specified id from default template", () => {
			var	projectIntegrationTest = new ProjectIntegrationTest();
			var tempFolder = temp.mkdirSync("project1");
			var projectName = "myapp";

			options.path = tempFolder;
			options["copy-from"] = projectIntegrationTest.getDefaultTemplatePath().wait();
			options.appid = "my.special.id";

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, options.appid).wait();
		});
	});
});