/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');
import * as constants from "./../lib/constants";
import * as ChildProcessLib from "../lib/common/child-process";

import ProjectServiceLib = require("../lib/services/project-service");
import ProjectDataServiceLib = require("../lib/services/project-data-service");
import ProjectDataLib = require("../lib/project-data");
import ProjectHelperLib = require("../lib/common/project-helper");
import StaticConfigLib = require("../lib/config");
import NpmLib = require("../lib/node-package-manager");
import NpmInstallationManagerLib = require("../lib/npm-installation-manager");
import HttpClientLib = require("../lib/common/http-client");
import fsLib = require("../lib/common/file-system");
import platformServiceLib = require("../lib/services/platform-service");

import path = require("path");
import temp = require("temp");
import util = require("util");
import helpers = require("../lib/common/helpers");

var assert = require("chai").assert;
var optionsLib = require("../lib/options");
var hostInfoLib = require("../lib/common/host-info");
var mockProjectNameValidator = {
	validate: () => { return true; }
};

temp.track();

class ProjectIntegrationTest {
	public testInjector: IInjector;

	constructor() {
		this.createTestInjector();
	}

	public createProject(projectName: string): IFuture<void> {
		var projectService = this.testInjector.resolve("projectService");
		return projectService.createProject(projectName);
	}

	public getDefaultTemplatePath(): IFuture<string> {
		return (() => {
			var npmInstallationManager = this.testInjector.resolve("npmInstallationManager");
			var fs = this.testInjector.resolve("fs");

			var defaultTemplatePackageName = "tns-template-hello-world";
			var cacheRoot = npmInstallationManager.getCacheRootPath();
			var defaultTemplatePath = path.join(cacheRoot, defaultTemplatePackageName);
			var latestVersion = npmInstallationManager.getLatestVersion(defaultTemplatePackageName).wait();

			if(!fs.exists(path.join(defaultTemplatePath, latestVersion)).wait()) {
				npmInstallationManager.addToCache(defaultTemplatePackageName, latestVersion).wait();
			}
			if(!fs.exists(path.join(defaultTemplatePath, latestVersion, "package", "app")).wait()) {
				npmInstallationManager.cacheUnpack(defaultTemplatePackageName, latestVersion).wait();
			}

			return path.join(defaultTemplatePath, latestVersion, "package");
		}).future<string>()();
	}

	public assertProject(tempFolder: string, projectName: string, appId: string): IFuture<void> {
		return (() => {
			var fs: IFileSystem = this.testInjector.resolve("fs");
			var projectDir = path.join(tempFolder, projectName);
			var appDirectoryPath = path.join(projectDir, "app");
			var platformsDirectoryPath = path.join(projectDir, "platforms");
			let tnsProjectFilePath = path.join(projectDir, "package.json");
			let tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);

			var options = this.testInjector.resolve("options");

			assert.isTrue(fs.exists(appDirectoryPath).wait());
			assert.isTrue(fs.exists(platformsDirectoryPath).wait());
			assert.isTrue(fs.exists(tnsProjectFilePath).wait());
			assert.isTrue(fs.exists(tnsModulesPath).wait());

			assert.isFalse(fs.isEmptyDir(appDirectoryPath).wait());
			assert.isTrue(fs.isEmptyDir(platformsDirectoryPath).wait());

			var actualAppId = fs.readJson(tnsProjectFilePath).wait()["nativescript"].id;
			var expectedAppId = appId;
			assert.equal(actualAppId, expectedAppId);

			let tnsCoreModulesRecord = fs.readJson(tnsProjectFilePath).wait()["dependencies"][constants.TNS_CORE_MODULES_NAME];
			assert.isTrue(tnsCoreModulesRecord !== null);

			var actualFiles = fs.enumerateFilesInDirectorySync(options.copyFrom);
			var expectedFiles = fs.enumerateFilesInDirectorySync(appDirectoryPath);

			assert.equal(actualFiles.length, expectedFiles.length);
			_.each(actualFiles, file => {
				var relativeToProjectDir = helpers.getRelativeToRootPath(options.copyFrom, file);
				assert.isTrue(fs.exists(path.join(appDirectoryPath, relativeToProjectDir)).wait());
			});
		}).future<void>()();
	}

	public dispose(): void {
		this.testInjector = undefined;
	}

	private createTestInjector(): void {
		this.testInjector = new yok.Yok();
		this.testInjector.register("childProcess", ChildProcessLib.ChildProcess);	
		this.testInjector.register("errors", stubs.ErrorsStub);
		this.testInjector.register('logger', stubs.LoggerStub);
		this.testInjector.register("projectService", ProjectServiceLib.ProjectService);
		this.testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
		this.testInjector.register("projectTemplatesService", stubs.ProjectTemplatesService);
		this.testInjector.register("projectNameValidator", mockProjectNameValidator);

		this.testInjector.register("fs", fsLib.FileSystem);
		this.testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
		this.testInjector.register("staticConfig", StaticConfigLib.StaticConfig);

		this.testInjector.register("npmInstallationManager", NpmInstallationManagerLib.NpmInstallationManager);
		this.testInjector.register("npm", NpmLib.NodePackageManager);
		this.testInjector.register("httpClient", HttpClientLib.HttpClient);
		this.testInjector.register("config", {});
		this.testInjector.register("lockfile", stubs.LockFile);
		
		this.testInjector.register("options", optionsLib.Options);
		this.testInjector.register("hostInfo", hostInfoLib.HostInfo);
	}
}

describe("Project Service Tests", () => {
	describe("project service integration tests", () => {
		it("creates valid project from default template", () => {
			var	projectIntegrationTest = new ProjectIntegrationTest();
			var tempFolder = temp.mkdirSync("project");
			var projectName = "myapp";
			var options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			options.copyFrom = projectIntegrationTest.getDefaultTemplatePath().wait();

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, "org.nativescript.myapp").wait();
		});
		it("creates valid project with specified id from default template", () => {
			var	projectIntegrationTest = new ProjectIntegrationTest();
			var tempFolder = temp.mkdirSync("project1");
			var projectName = "myapp";
			var options = projectIntegrationTest.testInjector.resolve("options");

			options.path = tempFolder;
			options.copyFrom = projectIntegrationTest.getDefaultTemplatePath().wait();
			options.appid = "my.special.id";

			projectIntegrationTest.createProject(projectName).wait();
			projectIntegrationTest.assertProject(tempFolder, projectName, options.appid).wait();
		});
	});
});

function createTestInjector() {
	var testInjector = new yok.Yok();
	
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register("projectService", ProjectServiceLib.ProjectService);
	testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
	testInjector.register("projectTemplatesService", stubs.ProjectTemplatesService);
	testInjector.register("projectNameValidator", mockProjectNameValidator);

	testInjector.register("fs", fsLib.FileSystem);
	testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
	
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);

	testInjector.register("npmInstallationManager", NpmInstallationManagerLib.NpmInstallationManager);
	testInjector.register("httpClient", HttpClientLib.HttpClient);
	testInjector.register("config", {});
	testInjector.register("lockfile", stubs.LockFile);

	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	
	testInjector.register('projectData', ProjectDataLib.ProjectData);
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	
	return testInjector;
}

describe("project upgrade procedure tests", () => {
	it("should throw error when no nativescript project folder specified", () => {
		var testInjector = createTestInjector();
		var tempFolder = temp.mkdirSync("project upgrade");
		var options = testInjector.resolve("options");
		options.path = tempFolder;
		var isErrorThrown = false;
		
		try {
			testInjector.resolve("projectData"); // This should trigger upgrade procedure
		} catch(err) {
			isErrorThrown = true;
			var expectedErrorMessage = "No project found at or above '%s' and neither was a --path specified.," + tempFolder;
			assert.equal(expectedErrorMessage, err.toString());
		}
		
		assert.isTrue(isErrorThrown);
	});
	it("should upgrade project when .tnsproject file exists but package.json file doesn't exist", () => {
		var testInjector = createTestInjector();
		var fs: IFileSystem = testInjector.resolve("fs");
		
		var tempFolder = temp.mkdirSync("projectUpgradeTest2");	
		var options = testInjector.resolve("options");
		options.path = tempFolder;	
		var tnsProjectData = {
			"id": "org.nativescript.Test",
			"tns-ios": {
				"version": "1.0.0"
			}	
		};
		var tnsProjectFilePath = path.join(tempFolder, ".tnsproject");
		fs.writeJson(tnsProjectFilePath, tnsProjectData).wait();
		
		testInjector.resolve("projectData"); // This should trigger upgrade procedure
		
		var packageJsonFilePath = path.join(tempFolder, "package.json");
		var packageJsonFileContent = require(packageJsonFilePath);
		assert.isTrue(fs.exists(packageJsonFilePath).wait());
		assert.isFalse(fs.exists(tnsProjectFilePath).wait());
		assert.deepEqual(tnsProjectData, packageJsonFileContent["nativescript"]);
	}); 
	it("should upgrade project when .tnsproject and package.json exist but nativescript key is not presented in package.json file", () => {
		var testInjector = createTestInjector();
		var fs: IFileSystem = testInjector.resolve("fs");
		
		var tempFolder = temp.mkdirSync("projectUpgradeTest3");	
		var options = testInjector.resolve("options");
		options.path = tempFolder;	
		var tnsProjectData = {
			"id": "org.nativescript.Test",
			"tns-ios": {
				"version": "1.0.1"
			}	
		};
		var packageJsonData = {
			"name": "testModuleName",
			"version": "0.0.0",
			"dependencies": {
				"myFirstDep": "0.0.1"
			}
		}
		let tnsProjectFilePath = path.join(tempFolder, ".tnsproject");
		fs.writeJson(tnsProjectFilePath, tnsProjectData).wait();
		
		var packageJsonFilePath = path.join(tempFolder, "package.json");
		fs.writeJson(packageJsonFilePath, packageJsonData).wait();
		
		testInjector.resolve("projectData"); // This should trigger upgrade procedure
		
		var packageJsonFileContent = require(packageJsonFilePath);
		var expectedPackageJsonContent: any = packageJsonData;
		expectedPackageJsonContent["nativescript"] = tnsProjectData;
		assert.deepEqual(expectedPackageJsonContent, packageJsonFileContent);
	});
	it("shouldn't upgrade project when .tnsproject and package.json exist and nativescript key is presented in package.json file", () => {
		var testInjector = createTestInjector();
		var fs: IFileSystem = testInjector.resolve("fs");
		
		var tempFolder = temp.mkdirSync("projectUpgradeTest4");	
		var options = testInjector.resolve("options");
		options.path = tempFolder;	
		var tnsProjectData = {
			
		};
		var packageJsonData = {
			"name": "testModuleName",
			"version": "0.0.0",
			"dependencies": {
				"myFirstDep": "0.0.2"
			},
			"nativescript": {
				"id": "org.nativescript.Test",
				"tns-ios": {
					"version": "1.0.2"
				}	
			}
		}
		
		fs.writeJson(path.join(tempFolder, ".tnsproject"), tnsProjectData).wait();
		fs.writeJson(path.join(tempFolder, "package.json"), packageJsonData).wait();
		testInjector.resolve("projectData"); // This should trigger upgrade procedure
		
		var packageJsonFilePath = path.join(tempFolder, "package.json");
		var packageJsonFileContent = require(packageJsonFilePath);
		
		assert.deepEqual(packageJsonData, packageJsonFileContent);
	});
}); 