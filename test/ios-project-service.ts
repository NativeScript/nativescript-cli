/// <reference path=".d.ts" />
"use strict";

import Future = require("fibers/future");
import * as path from "path";
import * as ChildProcessLib from "../lib/common/child-process";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FileSystemLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as iOSProjectServiceLib from "../lib/services/ios-project-service";
import * as LoggerLib from "../lib/common/logger";
import * as OptionsLib from "../lib/options";
import * as yok from "../lib/common/yok";
import {DevicesService} from "../lib/common/mobile/mobile-core/devices-service";
import {MobileHelper} from "../lib/common/mobile/mobile-helper";
import {Messages} from "../lib/common/messages/messages";
import {MobilePlatformsCapabilities} from "../lib/mobile-platforms-capabilities";
import {DeviceLogProvider} from "../lib/common/mobile/device-log-provider";
import {LogFilter} from "../lib/common/mobile/log-filter";
import {LoggingLevels} from "../lib/common/mobile/logging-levels";
import {DeviceDiscovery} from "../lib/common/mobile/mobile-core/device-discovery";
import {IOSDeviceDiscovery} from "../lib/common/mobile/mobile-core/ios-device-discovery";
import {AndroidDeviceDiscovery} from "../lib/common/mobile/mobile-core/android-device-discovery";
import {PluginVariablesService} from "../lib/services/plugin-variables-service";
import {PluginVariablesHelper} from "../lib/common/plugin-variables-helper";
import {Utils} from "../lib/common/utils";
import { assert } from "chai";
import temp = require("temp");
temp.track();

class IOSSimulatorDiscoveryMock extends DeviceDiscovery {
	public startLookingForDevices(): IFuture<void> {
		return Future.fromResult();
	}

	public checkForDevices(): IFuture<void> {
		return Future.fromResult();
	}
}

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
		projectName: projectName,
		projectPath: projectPath,
		projectFilePath: path.join(projectPath, "package.json")
	});
	testInjector.register("projectHelper", {});
	testInjector.register("staticConfig", ConfigLib.StaticConfig);
	testInjector.register("projectDataService", {});
	testInjector.register("prompter", {});
	testInjector.register("devicePlatformsConstants", { iOS: "iOS" });
	testInjector.register("devicesService", DevicesService);
	testInjector.register("iOSDeviceDiscovery", IOSDeviceDiscovery);
	testInjector.register("iOSSimulatorDiscovery", IOSSimulatorDiscoveryMock);
	testInjector.register("iOSSimResolver", {});
	testInjector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);
	testInjector.register("messages", Messages);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("deviceLogProvider", DeviceLogProvider);
	testInjector.register("logFilter", LogFilter);
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("utils", Utils);
	testInjector.register("iTunesValidator", {});
	testInjector.register("pluginVariablesService", PluginVariablesService);
	testInjector.register("pluginVariablesHelper", PluginVariablesHelper);
	return testInjector;
}

function createPackageJson(testInjector: IInjector, projectPath: string, projectName: string) {
	let packageJsonData = {
		"name": projectName,
		"version": "0.1.0",
		"nativescript": {
			"tns-ios": {
				"version": "1.0.0"
			},
			"tns-android": {
				"version": "1.0.0"
			}
		}
	};
	testInjector.resolve("fs").writeJson(path.join(projectPath, "package.json"), packageJsonData).wait();
}

describe("Cocoapods support", () => {
	if (require("os").platform() !== "darwin") {
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
					"tns-ios": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData).wait();

			let platformsFolderPath = path.join(projectPath, "ios");
			fs.createDirectory(platformsFolderPath).wait();

			let iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.prepareStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => { return {}; }
				};
			};
			iOSProjectService.savePbxProj = (): IFuture<void> => Future.fromResult();

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
			let expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n",
				"end"]
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
					"tns-ios": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData).wait();

			let platformsFolderPath = path.join(projectPath, "ios");
			fs.createDirectory(platformsFolderPath).wait();

			let iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.prepareStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.removeFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.removeStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> => {
				return Future.fromResult();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => { return {}; }
				};
			};
			iOSProjectService.savePbxProj = (): IFuture<void> => Future.fromResult();

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
			let expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n",
				"end"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			iOSProjectService.removePluginNativeCode(pluginData).wait();

			assert.isFalse(fs.exists(projectPodfilePath).wait());
		});
	}
});

describe("Static libraries support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping static library tests. They work only on darwin.");
		return;
	}

	let projectName = "projectDirectory";
	let projectPath = temp.mkdirSync(projectName);
	let libraryName = "testLibrary1";
	let headers = ["TestHeader1.h", "TestHeader2.h"];
	let testInjector = createTestInjector(projectPath, projectName);
	let fs: IFileSystem = testInjector.resolve("fs");
	let staticLibraryPath = path.join(path.join(temp.mkdirSync("pluginDirectory"), "platforms", "ios"));
	let staticLibraryHeadersPath = path.join(staticLibraryPath,"include", libraryName);

	it("checks validation of header files", () => {
		let iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath).wait();
		_.each(headers, header => { fs.writeFile(path.join(staticLibraryHeadersPath, header), "").wait(); });

		// Add all header files.
		fs.writeFile(path.join(staticLibraryHeadersPath, libraryName + ".a"), "").wait();

		let error: any;
		try {
			iOSProjectService.validateStaticLibrary(path.join(staticLibraryPath, libraryName + ".a")).wait();
		} catch(err) {
			error = err;
		}

		assert.instanceOf(error, Error, "Expect to fail, the .a file is not a static library.");
	});

	it("checks generation of modulemaps", () => {
		let iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath).wait();
		_.each(headers, header => { fs.writeFile(path.join(staticLibraryHeadersPath, header), "").wait(); });

		iOSProjectService.generateMobulemap(staticLibraryHeadersPath, libraryName);
		// Read the generated modulemap and verify it.
		let modulemap = fs.readFile(path.join(staticLibraryHeadersPath, "module.modulemap")).wait();
		let headerCommands = _.map(headers, value => `header "${value}"`);
		let modulemapExpectation = `module ${libraryName} { explicit module ${libraryName} { ${headerCommands.join(" ")} } }`;

		assert.equal(modulemap, modulemapExpectation);

		// Delete all header files. And try to regenerate modulemap.
		_.each(headers, header => { fs.deleteFile(path.join(staticLibraryHeadersPath, header)).wait(); });
		iOSProjectService.generateMobulemap(staticLibraryHeadersPath, libraryName);

		let error: any;
		try {
			modulemap = fs.readFile(path.join(staticLibraryHeadersPath, "module.modulemap")).wait();
		} catch(err) {
			error = err;
		}

		assert.instanceOf(error, Error, "Expect to fail, there shouldn't be a module.modulemap file.");
	});
});

describe("Relative paths", () => {
		it("checks for correct calculation of relative paths", () => {
			let projectName = "projectDirectory";
			let projectPath = temp.mkdirSync(projectName);
			let subpath = "sub/path";

			let testInjector = createTestInjector(projectPath, projectName);
			createPackageJson(testInjector, projectPath, projectName);
			let iOSProjectService = testInjector.resolve("iOSProjectService");

			let result = iOSProjectService.getLibSubpathRelativeToProjectPath(subpath);
			assert.equal(result, path.join("../../lib/iOS/", subpath));
		});
});
