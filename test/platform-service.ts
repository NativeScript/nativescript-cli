/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');

import PlatformServiceLib = require('../lib/services/platform-service');
import ProjectServiceLib = require("../lib/services/project-service");
import NodePackageManagerLib = require('../lib/node-package-manager');
import ProjectDataServiceLib = require("../lib/services/project-data-service");
import StaticConfigLib = require("../lib/config");
import fsLib = require("../lib/common/file-system");
import ProjectLib = require('../lib/services/project-service');
import ProjectServiceTestLib = require('./project-service');
import NpmLib = require("../lib/node-package-manager");
import HttpClientLib = require("../lib/common/http-client");
import ProjectDataLib = require("../lib/project-data");
import ProjectHelperLib = require("../lib/common/project-helper");
import optionsLib = require("../lib/options");
import hostInfoLib = require("../lib/common/host-info");

import path = require("path");
import Future = require("fibers/future");

var assert = require("chai").assert;
require('should');

let temp = require("temp");
temp.track();

function createTestInjector() {
	var testInjector = new yok.Yok();

	testInjector.register('platformService', PlatformServiceLib.PlatformService);
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register('npm', stubs.NPMStub);
	testInjector.register('projectData', stubs.ProjectDataStub);
	testInjector.register('platformsData', stubs.PlatformsDataStub);
	testInjector.register('devicesServices', {});
	testInjector.register('androidEmulatorServices', {});
	testInjector.register('projectDataService', stubs.ProjectDataService);
	testInjector.register('prompter', {});
	testInjector.register('lockfile', stubs.LockFile);
	testInjector.register("commandsService", {
		tryExecuteCommand: () => {}
	});
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("broccoliBuilder", {
		prepareNodeModulesFolder: () => {}
	})

	return testInjector;
}

describe('Platform Service Tests', () => {
	var platformService: IPlatformService, testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		platformService = testInjector.resolve("platformService");
	});

	describe("add platform unit tests", () => {
		describe("#add platform()", () => {
			it("should not fail if platform is not normalized", () => {
				var fs = testInjector.resolve("fs");
				fs.exists = () => Future.fromResult(false);

				platformService.addPlatforms(["Android"]).wait();
				platformService.addPlatforms(["ANDROID"]).wait();
				platformService.addPlatforms(["AnDrOiD"]).wait();
				platformService.addPlatforms(["androiD"]).wait();

				platformService.addPlatforms(["iOS"]).wait();
				platformService.addPlatforms(["IOS"]).wait();
				platformService.addPlatforms(["IoS"]).wait();
				platformService.addPlatforms(["iOs"]).wait();
			});
			it("should fail if platform is already installed", () => {
				// By default fs.exists returns true, so the platforms directory should exists
				(() => platformService.addPlatforms(["android"]).wait()).should.throw();
				(() => platformService.addPlatforms(["ios"]).wait()).should.throw();
			});
			it("should fail if npm is unavalible", () => {
				var fs = testInjector.resolve("fs");
				fs.exists = () => Future.fromResult(false);

				var errorMessage = "Npm is unavalible";
				var npm = testInjector.resolve("npm");
				npm.install = () => { throw new Error(errorMessage) };

				try {
					platformService.addPlatforms(["android"]).wait();
				} catch(err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
		describe("#add platform(ios)", () => {
			it("should call validate method", () => {
				var fs = testInjector.resolve("fs");
				fs.exists = () => Future.fromResult(false);

				var errorMessage = "Xcode is not installed or Xcode version is smaller that 5.0";
				var platformsData = testInjector.resolve("platformsData");
				var platformProjectService = platformsData.getPlatformData().platformProjectService;
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};

				try {
					platformService.addPlatforms(["ios"]).wait();
				} catch(err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
		describe("#add platform(android)", () => {
			it("should fail if java, ant or android are not installed", () => {
				var fs = testInjector.resolve("fs");
				fs.exists = () => Future.fromResult(false);

				var errorMessage = "Java, ant or android are not installed";
				var platformsData = testInjector.resolve("platformsData");
				var platformProjectService = platformsData.getPlatformData().platformProjectService;
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};

				try {
					platformService.addPlatforms(["android"]).wait();
				} catch(err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
	});

	describe("remove platform unit tests", () => {
		it("should fail when platforms are not added", () => {
			testInjector.resolve("fs").exists = () => Future.fromResult(false);
			(() => platformService.removePlatforms(["android"]).wait()).should.throw();
			(() => platformService.removePlatforms(["ios"]).wait()).should.throw();
		});
		it("shouldn't fail when platforms are added", () => {
			testInjector.resolve("fs").exists = () => Future.fromResult(false);
			platformService.addPlatforms(["android"]).wait();

			testInjector.resolve("fs").exists = () => Future.fromResult(true);
			platformService.removePlatforms(["android"]).wait();
		});
	});

	describe("list platform unit tests", () => {
		it("fails when platforms are not added", () => {
			(() => platformService.getAvailablePlatforms().wait()).should.throw();
		});
	});

	describe("update Platform", () => {
		describe("#updatePlatform(platform)", () => {
			it("should fail when the versions are the same", () => {
				var npm: INodePackageManager = testInjector.resolve("npm");
				npm.getLatestVersion = () => (() => "0.2.0").future<string>()();
				npm.getCacheRootPath = () => "";

				(() => platformService.updatePlatforms(["android"]).wait()).should.throw();
			});
		});
	});
	
	describe("prepare platform unit tests", () => {
		let testInjector: IInjector, fs: IFileSystem;
		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.register("fs", fsLib.FileSystem);
			fs = testInjector.resolve("fs");
		});
		it("should process only files in app folder when preparing for iOS platform", () => {
			let tempFolder = temp.mkdirSync("prepare platform");
			
			let appFolderPath = path.join(tempFolder, "app");
			fs.createDirectory(appFolderPath).wait();
			
			let app1FolderPath = path.join(tempFolder, "app1");
			fs.createDirectory(app1FolderPath).wait();
			
			let appDestFolderPath = path.join(tempFolder, "appDest");
			let appResourcesFolderPath = path.join(appDestFolderPath, "App_Resources");
			
			// Add platform specific files to app and app1 folders
			let platformSpecificFiles = [
				"test1.ios.js", "test1-ios-js", "test2.android.js", "test2-android-js"
			];
			
			let destinationDirectories = [appFolderPath, app1FolderPath];
			
			_.each(destinationDirectories, directoryPath => {
				_.each(platformSpecificFiles, filePath => {
					let fileFullPath = path.join(directoryPath, filePath);
					fs.writeFile(fileFullPath, "testData").wait();
				});
			});
			
			let platformsData = testInjector.resolve("platformsData");
			platformsData.platformsNames = ["ios", "android"];			
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestFolderPath,
					appResourcesDestinationDirectoryPath: appResourcesFolderPath,
					normalizedPlatformName: "iOS"
				}	
			};
			
			let projectData = testInjector.resolve("projectData");
			projectData.projectDir = tempFolder;
			
			let platformService = testInjector.resolve("platformService");
			platformService.preparePlatform("ios").wait();
			
			// Asserts that the files in app folder are process as platform specific
			assert.isTrue(fs.exists(path.join(appDestFolderPath, "app" , "test1.js")).wait());
			assert.isTrue(fs.exists(path.join(appDestFolderPath, "app", "test1-js")).wait());
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app", "test2.js")).wait());
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app", "test2-js")).wait());
			
			// Asserts that the files in app1 folder aren't process as platform specific
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app1")).wait());
		});
		it("should process only files in app folder when preparing for Android platform", () => {
			let tempFolder = temp.mkdirSync("prepare platform");
		
			let appFolderPath = path.join(tempFolder, "app");
			fs.createDirectory(appFolderPath).wait();
			
			let app1FolderPath = path.join(tempFolder, "app1");
			fs.createDirectory(app1FolderPath).wait();
			
			let appDestFolderPath = path.join(tempFolder, "appDest");
			let appResourcesFolderPath = path.join(appDestFolderPath, "App_Resources");
			
			// Add platform specific files to app and app1 folders
			let platformSpecificFiles = [
				"test1.ios.js", "test1-ios-js", "test2.android.js", "test2-android-js"
			];
			
			let destinationDirectories = [appFolderPath, app1FolderPath];
			
			_.each(destinationDirectories, directoryPath => {
				_.each(platformSpecificFiles, filePath => {
					let fileFullPath = path.join(directoryPath, filePath);
					fs.writeFile(fileFullPath, "testData").wait();
				});
			});
			
			let platformsData = testInjector.resolve("platformsData");
			platformsData.platformsNames = ["ios", "android"];			
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestFolderPath,
					appResourcesDestinationDirectoryPath: appResourcesFolderPath,
					normalizedPlatformName: "Android"
				}	
			};
			
			let projectData = testInjector.resolve("projectData");
			projectData.projectDir = tempFolder;
			
			let platformService = testInjector.resolve("platformService");
			platformService.preparePlatform("android").wait();
			
			// Asserts that the files in app folder are process as platform specific
			assert.isTrue(fs.exists(path.join(appDestFolderPath, "app" , "test2.js")).wait());
			assert.isTrue(fs.exists(path.join(appDestFolderPath, "app", "test2-js")).wait());
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app", "test1.js")).wait());
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app", "test1-js")).wait());
			
			// Asserts that the files in app1 folder aren't process as platform specific
			assert.isFalse(fs.exists(path.join(appDestFolderPath, "app1")).wait());
		});
	});
});
