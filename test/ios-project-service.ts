/// <reference path=".d.ts" />
"use strict";

import Future = require("fibers/future");
import * as path from "path";
import temp = require("temp");
temp.track();

import ChildProcessLib = require("../lib/common/child-process");
import ConfigLib = require("../lib/config");
import ErrorsLib = require("../lib/common/errors");
import FileSystemLib = require("../lib/common/file-system");
import HostInfoLib = require("../lib/common/host-info");
import iOSProjectServiceLib = require("../lib/services/ios-project-service");
import LoggerLib = require("../lib/common/logger");
import OptionsLib = require("../lib/options");

import yok = require("../lib/common/yok");

import { assert } from "chai";

function createTestInjector(projectPath: string, projectName: string): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("fs", FileSystemLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("injector", testInjector);
	testInjector.register("iOSEmulatorServices", {});
	testInjector.register("iOSProjectService", iOSProjectServiceLib.IOSProjectService);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("projectData", {
		platformsDir: projectPath,
		projectName: projectName
	});
	testInjector.register("projectHelper", {});
	testInjector.register("staticConfig", ConfigLib.StaticConfig);

	return testInjector;
}

describe("Cocoapods support", () => {
	if (require("os").platform !== "darwin") {
		console.log("Skipping Cocoapods tests. They cannot work on windows");
	} else {
		it("adds plugin with Podfile", () => {
			let projectName = "projectDirectory";
			let projectPath = temp.mkdirSync(projectName);

			let testInjector = createTestInjector(projectPath, projectName);
			let fs: IFileSystem = testInjector.resolve("fs");

			let packageJsonData = {
				"name": "myProject",
				"version": "0.1.0",
				"nativescript": {
					"id": "org.nativescript.myProject",
					"tns-android": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData).wait();

			let platformsFolderPath = path.join(projectPath, "ios");
			fs.createDirectory(platformsFolderPath).wait();

			let iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareDynamicFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};

			let pluginPath = temp.mkdirSync("pluginDirectory");
			let pluginPlatformsFolderPath = path.join(pluginPath, "platforms", "ios");
			let pluginPodfilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			let pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'",  "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent).wait();

			let pluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return pluginPlatformsFolderPath;
				}
			};

			iOSProjectService.preparePluginNativeCode(pluginData).wait();

			let projectPodfilePath = path.join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath).wait());

			let actualProjectPodfileContent = fs.readText(projectPodfilePath).wait();
			let expectedProjectPodfileContent = [`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);
		});
		it("adds and removes plugin with Podfile", () => {
			let projectName = "projectDirectory2";
			let projectPath = temp.mkdirSync(projectName);

			let testInjector = createTestInjector(projectPath, projectName);
			let fs: IFileSystem = testInjector.resolve("fs");

			let packageJsonData = {
				"name": "myProject2",
				"version": "0.1.0",
				"nativescript": {
					"id": "org.nativescript.myProject2",
					"tns-android": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData).wait();

			let platformsFolderPath = path.join(projectPath, "ios");
			fs.createDirectory(platformsFolderPath).wait();

			let iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareDynamicFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.removeDynamicFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};

			let pluginPath = temp.mkdirSync("pluginDirectory");
			let pluginPlatformsFolderPath = path.join(pluginPath, "platforms", "ios");
			let pluginPodfilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			let pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'",  "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent).wait();

			let pluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return pluginPlatformsFolderPath;
				}
			};

			iOSProjectService.preparePluginNativeCode(pluginData).wait();

			let projectPodfilePath = path.join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath).wait());

			let actualProjectPodfileContent = fs.readText(projectPodfilePath).wait();
			let expectedProjectPodfileContent = [`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			iOSProjectService.removePluginNativeCode(pluginData).wait();

			assert.isFalse(fs.exists(projectPodfilePath).wait());
		});
	}
});
