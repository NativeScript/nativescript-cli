import * as path from "path";
import { EOL } from "os";
import * as ChildProcessLib from "../lib/common/child-process";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FileSystemLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as iOSProjectServiceLib from "../lib/services/ios-project-service";
import { IOSProjectService } from "../lib/services/ios-project-service";
import { IOSEntitlementsService } from "../lib/services/ios-entitlements-service";
import { XCConfigService } from "../lib/services/xcconfig-service";
import * as LoggerLib from "../lib/common/logger";
import * as OptionsLib from "../lib/options";
import * as yok from "../lib/common/yok";
import { DevicesService } from "../lib/common/mobile/mobile-core/devices-service";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { Messages } from "../lib/common/messages/messages";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DeviceLogProvider } from "../lib/common/mobile/device-log-provider";
import { LogFilter } from "../lib/common/mobile/log-filter";
import { LoggingLevels } from "../lib/common/mobile/logging-levels";
import { DeviceDiscovery } from "../lib/common/mobile/mobile-core/device-discovery";
import { IOSDeviceDiscovery } from "../lib/common/mobile/mobile-core/ios-device-discovery";
import { AndroidDeviceDiscovery } from "../lib/common/mobile/mobile-core/android-device-discovery";
import { PluginVariablesService } from "../lib/services/plugin-variables-service";
import { PluginsService } from "../lib/services/plugins-service";
import { PluginVariablesHelper } from "../lib/common/plugin-variables-helper";
import { Utils } from "../lib/common/utils";
import { CocoaPodsService } from "../lib/services/cocoapods-service";
import { NpmInstallationManager } from "../lib/npm-installation-manager";
import { NodePackageManager } from "../lib/node-package-manager";

import { assert } from "chai";
import { IOSProvisionService } from "../lib/services/ios-provision-service";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { BUILD_XCCONFIG_FILE_NAME } from "../lib/constants";
import { ProjectDataStub } from "./stubs";
import { xcode } from "../lib/node/xcode";
import temp = require("temp");
temp.track();

class IOSSimulatorDiscoveryMock extends DeviceDiscovery {
	public async startLookingForDevices(): Promise<void> {
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

function createTestInjector(projectPath: string, projectName: string, xcode?: IXcode): IInjector {
	const testInjector = new yok.Yok();
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("fs", FileSystemLib.FileSystem);
	testInjector.register("adb", {});
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("injector", testInjector);
	testInjector.register("iOSEmulatorServices", {});
	testInjector.register("cocoapodsService", CocoaPodsService);
	testInjector.register("iOSProjectService", iOSProjectServiceLib.IOSProjectService);
	testInjector.register("iOSProvisionService", {});
	testInjector.register("xCConfigService", XCConfigService);
	testInjector.register("iOSEntitlementsService", IOSEntitlementsService);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("options", OptionsLib.Options);
	const projectData = Object.assign({}, ProjectDataStub, {
		platformsDir: path.join(projectPath, "platforms"),
		projectName: projectName,
		projectPath: projectPath,
		projectFilePath: path.join(projectPath, "package.json")
	});
	testInjector.register("projectData", projectData);
	testInjector.register("projectHelper", {});
	testInjector.register("xcodeSelectService", {});
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
	testInjector.register("xcprojService", {
		getXcprojInfo: () => {
			return {
				shouldUseXcproj: false
			};
		}
	});
	testInjector.register("iosDeviceOperations", {});
	testInjector.register("pluginVariablesService", PluginVariablesService);
	testInjector.register("pluginVariablesHelper", PluginVariablesHelper);
	testInjector.register("pluginsService", PluginsService);
	testInjector.register("androidProcessService", {});
	testInjector.register("processService", {});
	testInjector.register("sysInfo", {});
	testInjector.register("pbxprojDomXcode", {});
	testInjector.register("xcode", xcode || {
		project: class {
			constructor() { /* */ }
			parseSync() { /* */ }
			pbxGroupByName() { /* */ }
		}
	});
	testInjector.register("npmInstallationManager", NpmInstallationManager);
	testInjector.register("npm", NodePackageManager);
	testInjector.register("xCConfigService", XCConfigService);
	testInjector.register("settingsService", SettingsService);
	testInjector.register("httpClient", {});
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("plistParser", {});
	testInjector.register("androidEmulatorServices", {});
	testInjector.register("androidEmulatorDiscovery", {
		on: () => ({})
	});
	testInjector.register("emulatorHelper", {});
	testInjector.register("filesHashService", {
		hasChangesInShasums: (oldPluginNativeHashes: IStringDictionary, currentPluginNativeHashes: IStringDictionary) => true,
		generateHashes: async (files: string[]): Promise<IStringDictionary> => ({})
	});

	return testInjector;
}

function createPackageJson(testInjector: IInjector, projectPath: string, projectName: string) {
	const packageJsonData = {
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
	testInjector.resolve("fs").writeJson(path.join(projectPath, "package.json"), packageJsonData);
}

function expectOption(args: string[], option: string, value: string, message?: string): void {
	const index = args.indexOf(option);
	assert.ok(index >= 0, "Expected " + option + " to be set.");
	assert.ok(args.length > index + 1, "Expected " + option + " to have value");
	assert.equal(args[index + 1], value, message);
}

function readOption(args: string[], option: string): string {
	const index = args.indexOf(option);
	assert.ok(index >= 0, "Expected " + option + " to be set.");
	assert.ok(args.length > index + 1, "Expected " + option + " to have value");
	return args[index + 1];
}

describe("iOSProjectService", () => {
	describe("archive", () => {
		async function setupArchive(options?: { archivePath?: string }): Promise<{ run: () => Promise<void>, assert: () => void }> {
			const hasCustomArchivePath = options && options.archivePath;

			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);

			const testInjector = createTestInjector(projectPath, projectName);
			const iOSProjectService = <IOSProjectService>testInjector.resolve("iOSProjectService");
			const projectData: IProjectData = testInjector.resolve("projectData");

			const childProcess = testInjector.resolve("childProcess");
			let xcodebuildExeced = false;

			let archivePath: string;

			childProcess.spawnFromEvent = (cmd: string, args: string[]) => {
				assert.equal(cmd, "xcodebuild", "Expected iOSProjectService.archive to call xcodebuild.archive");
				xcodebuildExeced = true;

				if (hasCustomArchivePath) {
					archivePath = path.resolve(options.archivePath);
				} else {
					archivePath = path.join(projectPath, "platforms", "ios", "build", "archive", projectName + ".xcarchive");
				}

				assert.ok(args.indexOf("archive") >= 0, "Expected xcodebuild to be executed with archive param.");

				expectOption(args, "-archivePath", archivePath, hasCustomArchivePath ? "Wrong path passed to xcarchive" : "Default xcarchive path is wrong.");
				expectOption(args, "-project", path.join(projectPath, "platforms", "ios", projectName + ".xcodeproj"), "Path to Xcode project is wrong.");
				expectOption(args, "-scheme", projectName, "The provided scheme is wrong.");

				return Promise.resolve();
			};

			let resultArchivePath: string;

			return {
				run: async (): Promise<void> => {
					if (hasCustomArchivePath) {
						resultArchivePath = await iOSProjectService.archive(projectData, null, { archivePath: options.archivePath });
					} else {
						resultArchivePath = await iOSProjectService.archive(projectData, null);
					}
				},
				assert: () => {
					assert.ok(xcodebuildExeced, "Expected xcodebuild archive to be executed");
					assert.equal(resultArchivePath, archivePath, "iOSProjectService.archive expected to return the path to the archive");
				}
			};
		}

		if (require("os").platform() !== "darwin") {
			console.log("Skipping iOS archive tests. They can work only on macOS");
		} else {
			it("by default exports xcodearchive to platforms/ios/build/archive/<projname>.xcarchive", async () => {
				const setup = await setupArchive();
				await setup.run();
				setup.assert();
			});
			it("can pass archivePath to xcodebuild -archivePath", async () => {
				const setup = await setupArchive({ archivePath: "myarchive.xcarchive" });
				await setup.run();
				setup.assert();
			});
		}
	});

	describe("exportArchive", () => {
		const noTeamPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>`;

		const myTeamPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>teamID</key>
    <string>MyTeam</string>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>`;

		async function testExportArchive(options: { teamID?: string }, expectedPlistContent: string): Promise<void> {
			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);

			const testInjector = createTestInjector(projectPath, projectName);
			const iOSProjectService = <IOSProjectService>testInjector.resolve("iOSProjectService");
			const projectData: IProjectData = testInjector.resolve("projectData");

			const archivePath = path.join(projectPath, "platforms", "ios", "build", "archive", projectName + ".xcarchive");

			const childProcess = testInjector.resolve("childProcess");
			const fs = <IFileSystem>testInjector.resolve("fs");

			let xcodebuildExeced = false;

			childProcess.spawnFromEvent = (cmd: string, args: string[]) => {
				assert.equal(cmd, "xcodebuild", "Expected xcodebuild to be called");
				xcodebuildExeced = true;

				assert.ok(args.indexOf("-exportArchive") >= 0, "Expected -exportArchive to be set on xcodebuild.");

				expectOption(args, "-archivePath", archivePath, "Expected the -archivePath to be passed to xcodebuild.");
				expectOption(args, "-exportPath", path.join(projectPath, "platforms", "ios", "build", "archive"), "Expected the -archivePath to be passed to xcodebuild.");
				const plist = readOption(args, "-exportOptionsPlist");

				assert.ok(plist);

				const plistContent = fs.readText(plist);
				// There may be better way to equal property lists
				assert.equal(plistContent, expectedPlistContent, "Mismatch in exportOptionsPlist content");

				return Promise.resolve();
			};

			const resultIpa = await iOSProjectService.exportArchive(projectData, { archivePath, teamID: options.teamID });
			const expectedIpa = path.join(projectPath, "platforms", "ios", "build", "archive", projectName + ".ipa");

			assert.equal(resultIpa, expectedIpa, "Expected IPA at the specified location");

			assert.ok(xcodebuildExeced, "Expected xcodebuild to be executed");
		}

		if (require("os").platform() !== "darwin") {
			console.log("Skipping iOS export archive tests. They can work only on macOS");
		} else {
			it("calls xcodebuild -exportArchive to produce .IPA", async () => {
				await testExportArchive({}, noTeamPlist);
			});

			it("passes the --team-id option down the xcodebuild -exportArchive throug the -exportOptionsPlist", async () => {
				await testExportArchive({ teamID: "MyTeam" }, myTeamPlist);
			});
		}
	});
});

describe("Cocoapods support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping Cocoapods tests. They cannot work on windows");
	} else {
		it("adds plugin with Podfile", async () => {
			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				"name": "myProject",
				"version": "0.1.0",
				"nativescript": {
					"id": "org.nativescript.myProject",
					"tns-ios": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = path.join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.prepareStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => { return {}; },
					pbxXCBuildConfigurationSection: () => { return {}; },
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const pluginPath = temp.mkdirSync("pluginDirectory");
			const pluginPlatformsFolderPath = path.join(pluginPath, "platforms", "ios");
			const pluginPodfilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			const pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const pluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return pluginPlatformsFolderPath;
				}
			};
			const projectData: IProjectData = testInjector.resolve("projectData");

			await iOSProjectService.preparePluginNativeCode(pluginData, projectData);

			const projectPodfilePath = path.join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n",
				"end"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);
		});
		it("adds and removes plugin with Podfile", async () => {
			const projectName = "projectDirectory2";
			const projectPath = temp.mkdirSync(projectName);

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				"name": "myProject2",
				"version": "0.1.0",
				"nativescript": {
					"id": "org.nativescript.myProject2",
					"tns-ios": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = path.join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.prepareStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeFrameworks = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeStaticLibs = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => { return {}; },
					pbxXCBuildConfigurationSection: () => { return {}; },
					removePbxGroup: () => { return {}; },
					removeFromHeaderSearchPaths: () => { return {}; },
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const pluginPath = temp.mkdirSync("pluginDirectory");
			const pluginPlatformsFolderPath = path.join(pluginPath, "platforms", "ios");
			const pluginPodfilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			const pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const pluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return pluginPlatformsFolderPath;
				}
			};
			const projectData: IProjectData = testInjector.resolve("projectData");

			await iOSProjectService.preparePluginNativeCode(pluginData, projectData);

			const projectPodfilePath = path.join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath} `,
				` ${pluginPodfileContent} `,
				" # End Podfile \n",
				"end"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			await iOSProjectService.removePluginNativeCode(pluginData, projectData);

			assert.isFalse(fs.exists(projectPodfilePath));
		});
	}
});

describe("Source code in plugin support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping Source code in plugin tests. They cannot work on windows");
	} else {

		const preparePluginWithFiles = async (files: string[], prepareMethodToCall: string) => {
			// Arrange
			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);
			const testInjector = createTestInjector(projectPath, projectName, xcode);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				"name": "myProject",
				"version": "0.1.0",
				"nativescript": {
					"id": "org.nativescript.myProject",
					"tns-ios": {
						"version": "1.0.0"
					}
				}
			};
			fs.writeJson(path.join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = path.join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");

			const mockPrepareMethods = ["prepareFrameworks", "prepareStaticLibs", "prepareResources", "prepareNativeSourceCode"];

			mockPrepareMethods.filter(m => m !== prepareMethodToCall).forEach(methodName => {
				iOSProjectService[methodName]  = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
					return Promise.resolve();
				};
			});

			iOSProjectService.getXcodeprojPath = () => {
				return path.join(__dirname, "files");
			};
			let pbxProj : any;
			iOSProjectService.savePbxProj = (project: any): Promise<void> => {
				pbxProj = project;
				return Promise.resolve();
			};

			const pluginPath = temp.mkdirSync("pluginDirectory");
			const pluginPlatformsFolderPath = path.join(pluginPath, "platforms", "ios");
			files.forEach(file => {
				const fullPath = path.join(pluginPlatformsFolderPath, file);
				fs.createDirectory(path.dirname(fullPath));
				fs.writeFile(fullPath, "");
			});

			const pluginData = {
				name: "testPlugin",
				pluginPlatformsFolderPath(platform: string): string {
					return pluginPlatformsFolderPath;
				}
			};

			const projectData: IProjectData = testInjector.resolve("projectData");

			// Act
			await iOSProjectService.preparePluginNativeCode(pluginData, projectData);

			return pbxProj;
		};

		it("adds plugin with Source files", async () => {
			const sourceFileNames = [
				"src/Header.h",	"src/ObjC.m",
				"src/nested/Header.hpp", "src/nested/Source.cpp", "src/nested/ObjCpp.mm",
				"src/nested/level2/Header2.hxx", "src/nested/level2/Source2.cxx", "src/nested/level2/Source3.c",
				"src/SomeOtherExtension.donotadd",
			];

			const pbxProj = await preparePluginWithFiles(sourceFileNames, "prepareNativeSourceCode");

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(key => pbxFileReference[key]);
			const buildPhaseFiles = pbxProj.hash.project.objects.PBXSourcesBuildPhase["858B83F218CA22B800AB12DE"].files;

			sourceFileNames.map(file => path.basename(file)).forEach(basename => {
				const ext = path.extname(basename);
				const shouldBeAdded = ext !== ".donotadd";
				if (shouldBeAdded) {
					assert.notEqual(pbxFileReferenceValues.indexOf(basename), -1, `${basename} not added to PBXFileRefereces`);

					if (shouldBeAdded && !path.extname(basename).startsWith(".h")) {
						const buildPhaseFile = buildPhaseFiles.find((fileObject: any) => fileObject.comment.startsWith(basename));
						assert.isDefined(buildPhaseFile, `${basename} not added to PBXSourcesBuildPhase`);
						assert.include(buildPhaseFile.comment, "in Sources", `${basename} must be added to Sources group`);
					}
				} else {
					assert.equal(pbxFileReferenceValues.indexOf(basename), -1, `${basename} was added to PBXFileRefereces, but it shouldn't have been`);
				}
			});
		});
		it("adds plugin with Resource files", async () => {
			const resFileNames = [
				"Resources/Image.png", "Resources/Jpeg.jpg", "Resources/screen.xib",
				"Resources/TestBundle.bundle/bundled.png",

			];

			const pbxProj = await preparePluginWithFiles(resFileNames, "prepareResources");

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(key => pbxFileReference[key]);
			const buildPhaseFiles = pbxProj.hash.project.objects.PBXResourcesBuildPhase["858B842C18CA22B800AB12DE"].files;

			resFileNames.forEach(filename => {
				const dirName = path.dirname(filename);
				const fileToCheck = dirName.endsWith(".bundle") ? dirName : filename;
				const basename = path.basename(fileToCheck);

				assert.isTrue(pbxFileReferenceValues.indexOf(basename) !== -1, `Resource ${filename} not added to PBXFileRefereces`);

				const buildPhaseFile = buildPhaseFiles.find((fileObject: any) => fileObject.comment.startsWith(basename));
				assert.isDefined(buildPhaseFile, `${fileToCheck} not added to PBXResourcesBuildPhase`);
				assert.include(buildPhaseFile.comment, "in Resources", `${fileToCheck} must be added to Resources group`);

			});
		});
	}
});

describe("Static libraries support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping static library tests. They work only on darwin.");
		return;
	}

	const projectName = "TNSApp";
	const projectPath = temp.mkdirSync(projectName);
	const libraryName = "testLibrary1";
	const headers = ["TestHeader1.h", "TestHeader2.h"];
	const testInjector = createTestInjector(projectPath, projectName);
	const fs: IFileSystem = testInjector.resolve("fs");
	const staticLibraryPath = path.join(path.join(temp.mkdirSync("pluginDirectory"), "platforms", "ios"));
	const staticLibraryHeadersPath = path.join(staticLibraryPath, "include", libraryName);

	it("checks validation of header files", async () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, header => { fs.writeFile(path.join(staticLibraryHeadersPath, header), ""); });

		// Add all header files.
		fs.writeFile(path.join(staticLibraryHeadersPath, libraryName + ".a"), "");

		let error: any;
		try {
			await iOSProjectService.validateStaticLibrary(path.join(staticLibraryPath, libraryName + ".a"));
		} catch (err) {
			error = err;
		}

		assert.instanceOf(error, Error, "Expect to fail, the .a file is not a static library.");
	});

	it("checks generation of modulemaps", () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, header => { fs.writeFile(path.join(staticLibraryHeadersPath, header), ""); });

		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);
		// Read the generated modulemap and verify it.
		let modulemap = fs.readFile(path.join(staticLibraryHeadersPath, "module.modulemap"));
		const headerCommands = _.map(headers, value => `header "${value}"`);
		const modulemapExpectation = `module ${libraryName} { explicit module ${libraryName} { ${headerCommands.join(" ")} } }`;

		assert.equal(modulemap, modulemapExpectation);

		// Delete all header files. And try to regenerate modulemap.
		_.each(headers, header => { fs.deleteFile(path.join(staticLibraryHeadersPath, header)); });
		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);

		let error: any;
		try {
			modulemap = fs.readFile(path.join(staticLibraryHeadersPath, "module.modulemap"));
		} catch (err) {
			error = err;
		}

		assert.instanceOf(error, Error, "Expect to fail, there shouldn't be a module.modulemap file.");
	});
});

describe("Relative paths", () => {
	it("checks for correct calculation of relative paths", () => {
		const projectName = "projectDirectory";
		const projectPath = temp.mkdirSync(projectName);
		const subpath = path.join(projectPath, "sub", "path");

		const testInjector = createTestInjector(projectPath, projectName);
		createPackageJson(testInjector, projectPath, projectName);
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		const projectData: IProjectData = testInjector.resolve("projectData");

		const result = iOSProjectService.getLibSubpathRelativeToProjectPath(subpath, projectData);
		assert.equal(result, path.join("..", "..", "sub", "path"));
	});
});

describe("iOS Project Service Signing", () => {
	let testInjector: IInjector;
	let projectName: string;
	let projectDirName: string;
	let projectPath: string;
	let files: any;
	let iOSProjectService: IPlatformProjectService;
	let projectData: any;
	let pbxproj: string;
	let iOSProvisionService: IOSProvisionService;
	let pbxprojDomXcode: IPbxprojDomXcode;

	beforeEach(() => {
		files = {};
		projectName = "TNSApp" + Math.ceil(Math.random() * 1000);
		projectDirName = projectName + "Dir";
		projectPath = temp.mkdirSync(projectDirName);
		testInjector = createTestInjector(projectPath, projectDirName);
		testInjector.register("fs", {
			files: {},
			readJson(path: string): any {
				if (this.exists(path)) {
					return JSON.stringify(files[path]);
				} else {
					return null;
				}
			},
			exists(path: string): boolean {
				return path in files;
			}
		});
		testInjector.register("pbxprojDomXcode", { Xcode: {} });
		pbxproj = path.join(projectPath, `platforms/ios/${projectDirName}.xcodeproj/project.pbxproj`);
		iOSProjectService = testInjector.resolve("iOSProjectService");
		iOSProvisionService = testInjector.resolve("iOSProvisionService");
		pbxprojDomXcode = testInjector.resolve("pbxprojDomXcode");
		projectData = testInjector.resolve("projectData");
		iOSProvisionService.pick = async (uuidOrName: string, projId: string) => {
			return (<any>{
				"NativeScriptDev": {
					Name: "NativeScriptDev",
					CreationDate: null,
					ExpirationDate: null,
					TeamName: "Telerik AD",
					TeamIdentifier: ["TKID101"],
					ProvisionedDevices: [],
					Entitlements: {
						"application-identifier": "*",
						"com.apple.developer.team-identifier": "ABC"
					},
					UUID: "12345",
					ProvisionsAllDevices: false,
					ApplicationIdentifierPrefix: null,
					DeveloperCertificates: null,
					Type: "Development"
				},
				"NativeScriptDist": {
					Name: "NativeScriptDist",
					CreationDate: null,
					ExpirationDate: null,
					TeamName: "Telerik AD",
					TeamIdentifier: ["TKID202"],
					ProvisionedDevices: [],
					Entitlements: {
						"application-identifier": "*",
						"com.apple.developer.team-identifier": "ABC"
					},
					UUID: "6789",
					ProvisionsAllDevices: true,
					ApplicationIdentifierPrefix: null,
					DeveloperCertificates: null,
					Type: "Distribution"
				},
				"NativeScriptAdHoc": {
					Name: "NativeScriptAdHoc",
					CreationDate: null,
					ExpirationDate: null,
					TeamName: "Telerik AD",
					TeamIdentifier: ["TKID303"],
					ProvisionedDevices: [],
					Entitlements: {
						"application-identifier": "*",
						"com.apple.developer.team-identifier": "ABC"
					},
					UUID: "1010",
					ProvisionsAllDevices: true,
					ApplicationIdentifierPrefix: null,
					DeveloperCertificates: null,
					Type: "Distribution"
				}
			})[uuidOrName];
		};
	});

	describe("Check for Changes", () => {
		it("sets signingChanged if no Xcode project exists", async () => {
			const changes = <IProjectChangesInfo>{};
			await iOSProjectService.checkForChanges(changes, { bundle: false, release: false, provision: "NativeScriptDev", teamId: undefined, useHotModuleReload: false }, projectData);
			assert.isTrue(!!changes.signingChanged);
		});
		it("sets signingChanged if the Xcode projects is configured with Automatic signing, but proivsion is specified", async () => {
			files[pbxproj] = "";
			pbxprojDomXcode.Xcode.open = <any>function (path: string) {
				assert.equal(path, pbxproj);
				return {
					getSigning(x: string) {
						return { style: "Automatic" };
					}
				};
			};
			const changes = <IProjectChangesInfo>{};
			await iOSProjectService.checkForChanges(changes, { bundle: false, release: false, provision: "NativeScriptDev", teamId: undefined, useHotModuleReload: false }, projectData);
			assert.isTrue(!!changes.signingChanged);
		});
		it("sets signingChanged if the Xcode projects is configured with Manual signing, but the proivsion specified differs the selected in the pbxproj", async () => {
			files[pbxproj] = "";
			pbxprojDomXcode.Xcode.open = <any>function (path: string) {
				assert.equal(path, pbxproj);
				return {
					getSigning() {
						return {
							style: "Manual", configurations: {
								Debug: { name: "NativeScriptDev2" },
								Release: { name: "NativeScriptDev2" }
							}
						};
					}
				};
			};
			const changes = <IProjectChangesInfo>{};
			await iOSProjectService.checkForChanges(changes, { bundle: false, release: false, provision: "NativeScriptDev", teamId: undefined, useHotModuleReload: false }, projectData);
			assert.isTrue(!!changes.signingChanged);
		});
		it("does not set signingChanged if the Xcode projects is configured with Manual signing and proivsion matches", async () => {
			files[pbxproj] = "";
			pbxprojDomXcode.Xcode.open = <any>function (path: string) {
				assert.equal(path, pbxproj);
				return {
					getSigning() {
						return {
							style: "Manual", configurations: {
								Debug: { name: "NativeScriptDev" },
								Release: { name: "NativeScriptDev" }
							}
						};
					}
				};
			};
			const changes = <IProjectChangesInfo>{};
			await iOSProjectService.checkForChanges(changes, { bundle: false, release: false, provision: "NativeScriptDev", teamId: undefined, useHotModuleReload: false }, projectData);
			assert.isFalse(!!changes.signingChanged);
		});
	});

	describe("specifying provision", () => {
		describe("from Automatic to provision name", () => {
			beforeEach(() => {
				files[pbxproj] = "";
				pbxprojDomXcode.Xcode.open = <any>function (path: string) {
					return {
						getSigning(x: string) {
							return { style: "Automatic", teamID: "AutoTeam" };
						}
					};
				};
			});
			it("fails with proper error if the provision can not be found", async () => {
				try {
					await iOSProjectService.prepareProject(projectData, { sdk: undefined, provision: "NativeScriptDev2", teamId: undefined });
				} catch (e) {
					assert.isTrue(e.toString().indexOf("Failed to find mobile provision with UUID or Name: NativeScriptDev2") >= 0);
				}
			});
			it("succeeds if the provision name is provided for development cert", async () => {
				const stack: any = [];
				pbxprojDomXcode.Xcode.open = <any>function (path: string) {
					assert.equal(path, pbxproj);
					return {
						getSigning() {
							return { style: "Automatic", teamID: "AutoTeam" };
						},
						save() {
							stack.push("save()");
						},
						setManualSigningStyle(targetName: string, manualSigning: any) {
							stack.push({ targetName, manualSigning });
						}
					};
				};
				await iOSProjectService.prepareProject(projectData, { sdk: undefined, provision: "NativeScriptDev", teamId: undefined });
				assert.deepEqual(stack, [{ targetName: projectDirName, manualSigning: { team: "TKID101", uuid: "12345", name: "NativeScriptDev", identity: "iPhone Developer" } }, "save()"]);
			});
			it("succeds if the provision name is provided for distribution cert", async () => {
				const stack: any = [];
				pbxprojDomXcode.Xcode.open = <any>function (path: string) {
					assert.equal(path, pbxproj);
					return {
						getSigning() {
							return { style: "Automatic", teamID: "AutoTeam" };
						},
						save() {
							stack.push("save()");
						},
						setManualSigningStyle(targetName: string, manualSigning: any) {
							stack.push({ targetName, manualSigning });
						}
					};
				};
				await iOSProjectService.prepareProject(projectData, { sdk: undefined, provision: "NativeScriptDist", teamId: undefined });
				assert.deepEqual(stack, [{ targetName: projectDirName, manualSigning: { team: "TKID202", uuid: "6789", name: "NativeScriptDist", identity: "iPhone Distribution" } }, "save()"]);
			});
			it("succeds if the provision name is provided for adhoc cert", async () => {
				const stack: any = [];
				pbxprojDomXcode.Xcode.open = <any>function (path: string) {
					assert.equal(path, pbxproj);
					return {
						getSigning() {
							return { style: "Automatic", teamID: "AutoTeam" };
						},
						save() {
							stack.push("save()");
						},
						setManualSigningStyle(targetName: string, manualSigning: any) {
							stack.push({ targetName, manualSigning });
						}
					};
				};
				await iOSProjectService.prepareProject(projectData, { sdk: undefined, provision: "NativeScriptAdHoc", teamId: undefined });
				assert.deepEqual(stack, [{ targetName: projectDirName, manualSigning: { team: "TKID303", uuid: "1010", name: "NativeScriptAdHoc", identity: "iPhone Distribution" } }, "save()"]);
			});
		});
	});
});

describe("Merge Project XCConfig files", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping 'Merge Project XCConfig files' tests. They can work only on macOS");
		return;
	}
	const assertPropertyValues = (expected: any, xcconfigPath: string, injector: IInjector) => {
		const service = <XCConfigService>injector.resolve('xCConfigService');
		_.forOwn(expected, (value, key) => {
			const actual = service.readPropertyValue(xcconfigPath, key);
			assert.equal(actual, value);
		});
	};

	let projectName: string;
	let projectPath: string;
	let testInjector: IInjector;
	let iOSProjectService: IOSProjectService;
	let projectData: IProjectData;
	let fs: IFileSystem;
	let appResourcesXcconfigPath: string;
	let appResourceXCConfigContent: string;
	let iOSEntitlementsService: IOSEntitlementsService;

	beforeEach(() => {
		projectName = "projectDirectory";
		projectPath = temp.mkdirSync(projectName);

		testInjector = createTestInjector(projectPath, projectName);
		iOSProjectService = testInjector.resolve("iOSProjectService");
		projectData = testInjector.resolve("projectData");
		projectData.projectDir = projectPath;
		projectData.appResourcesDirectoryPath = path.join(projectData.projectDir, "app", "App_Resources");

		iOSEntitlementsService = testInjector.resolve("iOSEntitlementsService");

		appResourcesXcconfigPath = path.join(projectData.appResourcesDirectoryPath, "iOS", BUILD_XCCONFIG_FILE_NAME);
		appResourceXCConfigContent = `CODE_SIGN_IDENTITY = iPhone Distribution
			// To build for device with XCode 8 you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
			// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
			ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
			ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;
			`;
		const testPackageJson = {
			"name": "test-project",
			"version": "0.0.1"
		};
		fs = testInjector.resolve("fs");
		fs.writeJson(path.join(projectPath, "package.json"), testPackageJson);
	});

	it("Uses the build.xcconfig file content from App_Resources", async () => {
		// setup app_resource build.xcconfig
		fs.writeFile(appResourcesXcconfigPath, appResourceXCConfigContent);

		// run merge for all release: debug|release
		for (const release in [true, false]) {
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(release, projectData);

			const destinationFilePath = release ? (<any>iOSProjectService).getPluginsReleaseXcconfigFilePath(projectData)
				: (<any>iOSProjectService).getPluginsDebugXcconfigFilePath(projectData);

			assert.isTrue(fs.exists(destinationFilePath), 'Target build xcconfig is missing for release: ' + release);
			const expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
				'ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME': 'LaunchImage',
				'CODE_SIGN_IDENTITY': 'iPhone Distribution'
			};
			assertPropertyValues(expected, destinationFilePath, testInjector);
		}
	});

	it("Adds the entitlements property if not set by the user", async () => {
		for (const release in [true, false]) {
			const realExistsFunction = testInjector.resolve("fs").exists;

			testInjector.resolve("fs").exists = (filePath: string) => {
				if (iOSEntitlementsService.getPlatformsEntitlementsPath(projectData) === filePath) {
					return true;
				}

				return realExistsFunction(filePath);
			};

			await (<any>iOSProjectService).mergeProjectXcconfigFiles(release, projectData);

			const destinationFilePath = release ? (<any>iOSProjectService).getPluginsReleaseXcconfigFilePath(projectData)
				: (<any>iOSProjectService).getPluginsDebugXcconfigFilePath(projectData);

			assert.isTrue(fs.exists(destinationFilePath), 'Target build xcconfig is missing for release: ' + release);
			const expected = {
				'CODE_SIGN_ENTITLEMENTS': iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData)
			};
			assertPropertyValues(expected, destinationFilePath, testInjector);
		}
	});

	it("The user specified entitlements property takes precedence", async () => {
		// setup app_resource build.xcconfig
		const expectedEntitlementsFile = 'user.entitlements';
		const xcconfigEntitlements = appResourceXCConfigContent + `${EOL}CODE_SIGN_ENTITLEMENTS = ${expectedEntitlementsFile}`;
		fs.writeFile(appResourcesXcconfigPath, xcconfigEntitlements);

		// run merge for all release: debug|release
		for (const release in [true, false]) {
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(release, projectData);

			const destinationFilePath = release ? (<any>iOSProjectService).getPluginsReleaseXcconfigFilePath(projectData)
				: (<any>iOSProjectService).getPluginsDebugXcconfigFilePath(projectData);

			assert.isTrue(fs.exists(destinationFilePath), 'Target build xcconfig is missing for release: ' + release);
			const expected = {
				'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
				'ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME': 'LaunchImage',
				'CODE_SIGN_IDENTITY': 'iPhone Distribution',
				'CODE_SIGN_ENTITLEMENTS': expectedEntitlementsFile
			};
			assertPropertyValues(expected, destinationFilePath, testInjector);
		}
	});

	it("creates empty plugins-<config>.xcconfig in case there are no build.xcconfig in App_Resources and in plugins", async () => {
		// run merge for all release: debug|release
		for (const release in [true, false]) {
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(release, projectData);

			const destinationFilePath = release ? (<any>iOSProjectService).getPluginsReleaseXcconfigFilePath(projectData)
				: (<any>iOSProjectService).getPluginsDebugXcconfigFilePath(projectData);

			assert.isTrue(fs.exists(destinationFilePath), 'Target build xcconfig is missing for release: ' + release);
			const content = fs.readFile(destinationFilePath).toString();
			assert.equal(content, "");
		}
	});
});
