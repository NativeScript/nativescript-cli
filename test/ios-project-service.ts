import { join, resolve, dirname, basename, extname } from "path";
import { EOL } from "os";
import * as ChildProcessLib from "../lib/common/child-process";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FileSystemLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as iOSProjectServiceLib from "../lib/services/ios-project-service";
import { IOSProjectService } from "../lib/services/ios-project-service";
import { IOSEntitlementsService } from "../lib/services/ios-entitlements-service";
import { XcconfigService } from "../lib/services/xcconfig-service";
import * as LoggerLib from "../lib/common/logger";
import * as OptionsLib from "../lib/options";
import * as yok from "../lib/common/yok";
import { DevicesService } from "../lib/common/mobile/mobile-core/devices-service";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { Messages } from "../lib/common/messages/messages";
import { DeviceLogProvider } from "../lib/common/mobile/device-log-provider";
import { LogFilter } from "../lib/common/mobile/log-filter";
import { LoggingLevels } from "../lib/common/mobile/logging-levels";
import { DeviceDiscovery } from "../lib/common/mobile/mobile-core/device-discovery";
import { IOSDeviceDiscovery } from "../lib/common/mobile/mobile-core/ios-device-discovery";
import { AndroidDeviceDiscovery } from "../lib/common/mobile/mobile-core/android-device-discovery";
import { PluginVariablesService } from "../lib/services/plugin-variables-service";
import { PluginVariablesHelper } from "../lib/common/plugin-variables-helper";
import { Utils } from "../lib/common/utils";
import { CocoaPodsService } from "../lib/services/cocoapods-service";
import { PackageManager } from "../lib/package-manager";
import { NodePackageManager } from "../lib/node-package-manager";
import { YarnPackageManager } from "../lib/yarn-package-manager";

import { assert } from "chai";
import { IOSProvisionService } from "../lib/services/ios-provision-service";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { BUILD_XCCONFIG_FILE_NAME } from "../lib/constants";
import { ProjectDataStub } from "./stubs";
import { xcode } from "../lib/node/xcode";
import temp = require("temp");
import { CocoaPodsPlatformManager } from "../lib/services/cocoapods-platform-manager";
temp.track();

class IOSSimulatorDiscoveryMock extends DeviceDiscovery {
	public async startLookingForDevices(): Promise<void> {
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

function createTestInjector(projectPath: string, projectName: string, xCode?: IXcode): IInjector {
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
	testInjector.register("xcconfigService", XcconfigService);
	testInjector.register("iOSEntitlementsService", IOSEntitlementsService);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("cocoaPodsPlatformManager", CocoaPodsPlatformManager);
	const projectData = Object.assign({}, ProjectDataStub, {
		platformsDir: join(projectPath, "platforms"),
		projectName: projectName,
		projectPath: projectPath,
		projectFilePath: join(projectPath, "package.json"),
		projectId: "",
		projectIdentifiers: { android: "", ios: "" },
		projectDir: "",
		appDirectoryPath: "",
		appResourcesDirectoryPath: "",
		getAppResourcesDirectoryPath: () => ""
	});
	projectData.projectDir = temp.mkdirSync("projectDir");
	projectData.appDirectoryPath = join(projectData.projectDir, "app");
	projectData.appResourcesDirectoryPath = join(projectData.appDirectoryPath, "App_Resources");
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
		},
		getXcodeprojPath: (projData: IProjectData, platformData: IPlatformData) => {
			return join(platformData.projectRoot, projData.projectName + ".xcodeproj");
		},
		checkIfXcodeprojIsRequired: () => ({})
	});
	testInjector.register("iosDeviceOperations", {});
	testInjector.register("pluginVariablesService", PluginVariablesService);
	testInjector.register("pluginVariablesHelper", PluginVariablesHelper);
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: (): string[] => []
	});
	testInjector.register("androidProcessService", {});
	testInjector.register("sysInfo", {
		getXcodeVersion: async () => ""
	});
	testInjector.register("pbxprojDomXcode", {});
	testInjector.register("xcode", xCode || {
		project: class {
			constructor() { /* */ }
			parseSync() { /* */ }
			pbxGroupByName() { /* */ }
			removeTargetsByProductType() { /* */ }
			writeSync() { /* */ }
		}
	});
	testInjector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<void> => undefined
	});
	testInjector.register("packageManager", PackageManager);
	testInjector.register("npm", NodePackageManager);
	testInjector.register("yarn", YarnPackageManager);
	testInjector.register("xcconfigService", XcconfigService);
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
	testInjector.register("pacoteService", {
		extractPackage: async (packageName: string, destinationDirectory: string, options?: IPacoteExtractOptions): Promise<void> => undefined
	});
	testInjector.register("iOSExtensionsService", {
		removeExtensions: () => { /* */ },
		addExtensionsFromPath: () => Promise.resolve()
	});
	testInjector.register("iOSWatchAppService", {
		removeWatchApp: () => { /* */ },
		addWatchAppFromPath: () => Promise.resolve()
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
	testInjector.resolve("fs").writeJson(join(projectPath, "package.json"), packageJsonData);
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
					archivePath = resolve(options.archivePath);
				} else {
					archivePath = join(projectPath, "platforms", "ios", "build", "Release-iphoneos", projectName + ".xcarchive");
				}

				assert.ok(args.indexOf("archive") >= 0, "Expected xcodebuild to be executed with archive param.");

				expectOption(args, "-archivePath", archivePath, hasCustomArchivePath ? "Wrong path passed to xcarchive" : "exports xcodearchive to platforms/ios/build/archive.");
				expectOption(args, "-project", join(projectPath, "platforms", "ios", projectName + ".xcodeproj"), "Path to Xcode project is wrong.");
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

			const archivePath = join(projectPath, "platforms", "ios", "build", "archive", projectName + ".xcarchive");

			const childProcess = testInjector.resolve("childProcess");
			const fs = <IFileSystem>testInjector.resolve("fs");

			let xcodebuildExeced = false;

			childProcess.spawnFromEvent = (cmd: string, args: string[]) => {
				assert.equal(cmd, "xcodebuild", "Expected xcodebuild to be called");
				xcodebuildExeced = true;

				assert.ok(args.indexOf("-exportArchive") >= 0, "Expected -exportArchive to be set on xcodebuild.");

				expectOption(args, "-archivePath", archivePath, "Expected the -archivePath to be passed to xcodebuild.");
				expectOption(args, "-exportPath", join(projectPath, "platforms", "ios", "build", "archive"), "Expected the -archivePath to be passed to xcodebuild.");
				const plist = readOption(args, "-exportOptionsPlist");

				assert.ok(plist);

				const plistContent = fs.readText(plist);
				// There may be better way to equal property lists
				assert.equal(plistContent, expectedPlistContent, "Mismatch in exportOptionsPlist content");

				return Promise.resolve();
			};

			const resultIpa = await iOSProjectService.exportArchive(projectData, { archivePath, teamID: options.teamID });
			const expectedIpa = join(projectPath, "platforms", "ios", "build", "archive", projectName + ".ipa");

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
		it("adds а base Podfile", async () => {
			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");
			const cocoapodsService = testInjector.resolve("cocoapodsService");

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
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => { return {}; },
					pbxXCBuildConfigurationSection: () => { return {}; },
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const projectData: IProjectData = testInjector.resolve("projectData");
			const basePodfileModuleName = "BasePodfile";

			const basePodfilePath = join(projectData.appDirectoryPath, "App_Resources", "iOS", "Podfile");
			const pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(basePodfilePath, pluginPodfileContent);

			projectData.podfilePath = basePodfilePath;

			await cocoapodsService.applyPodfileToProject(basePodfileModuleName, basePodfilePath, projectData, iOSProjectService.getPlatformData(projectData).projectRoot);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath), `File ${projectPodfilePath} must exist as we have already applied Podfile to it.`);

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "# platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${basePodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection",
			].join("\n");
			const expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${basePodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile\n",
				expectedPlatformSection,
				"end"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			fs.deleteFile(basePodfilePath);

			await cocoapodsService.applyPodfileToProject(basePodfileModuleName, basePodfilePath, projectData, iOSProjectService.getPlatformData(projectData).projectRoot);
			assert.isFalse(fs.exists(projectPodfilePath), `The projectPodfilePath (${projectPodfilePath}) must not exist when all Podfiles have been deleted and project is prepared again. (i.e. CLI should delete the project Podfile in this case)`);
		});

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
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, "platforms", "ios");
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
			const samplePluginPlatformsFolderPath = join(pluginPath, "platforms", "ios");
			const pluginPodfilePath = join(samplePluginPlatformsFolderPath, "Podfile");
			const pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const samplePluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				}
			};
			const projectData: IProjectData = testInjector.resolve("projectData");

			await iOSProjectService.preparePluginNativeCode(samplePluginData, projectData);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "# platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${pluginPodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection",
			].join("\n");
			const expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile\n",
				expectedPlatformSection,
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
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (pluginPlatformsPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.prepareStaticLibs = (pluginPlatformsPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeFrameworks = (pluginPlatformsPath: string, pluginData: IPluginData): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeStaticLibs = (pluginPlatformsPath: string, pluginData: IPluginData): Promise<void> => {
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
			const samplePluginPlatformsFolderPath = join(pluginPath, "platforms", "ios");
			const pluginPodfilePath = join(samplePluginPlatformsFolderPath, "Podfile");
			const pluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const samplePluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				},
				name: "pluginName",
				fullPath: "fullPath"
			};
			const projectData: IProjectData = testInjector.resolve("projectData");

			await iOSProjectService.preparePluginNativeCode(samplePluginData, projectData);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = ["source 'https://github.com/CocoaPods/Specs.git'", "# platform :ios, '8.1'", "pod 'GoogleMaps'"].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${pluginPodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection",
			].join("\n");
			const expectedProjectPodfileContent = ["use_frameworks!\n",
				`target "${projectName}" do`,
				`# Begin Podfile - ${pluginPodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile\n",
				expectedPlatformSection,
				"end"]
				.join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			await iOSProjectService.removePluginNativeCode(samplePluginData, projectData);

			assert.isFalse(fs.exists(projectPodfilePath));
		});
	}
});

describe("Source code support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping Source code in plugin tests. They cannot work on windows");
	} else {

		const getProjectWithoutPlugins = async (files: string[]) => {
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
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const xcprojService = testInjector.resolve("xcprojService");
			xcprojService.getXcodeprojPath = () => {
				return join(__dirname, "files");
			};

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			let pbxProj: any;
			iOSProjectService.savePbxProj = (project: any): Promise<void> => {
				pbxProj = project;
				return Promise.resolve();
			};

			const projectData: IProjectData = testInjector.resolve("projectData");

			const platformSpecificAppResourcesPath = join(projectData.appResourcesDirectoryPath, iOSProjectService.getPlatformData(projectData).normalizedPlatformName);

			files.forEach(file => {
				const fullPath = join(platformSpecificAppResourcesPath, file);
				fs.createDirectory(dirname(fullPath));
				fs.writeFile(fullPath, "");
			});

			await iOSProjectService.prepareNativeSourceCode("src", platformSpecificAppResourcesPath, projectData);

			return pbxProj;
		};

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
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");

			const mockPrepareMethods = ["prepareFrameworks", "prepareStaticLibs", "prepareResources", "prepareNativeSourceCode"];

			mockPrepareMethods.filter(m => m !== prepareMethodToCall).forEach(methodName => {
				iOSProjectService[methodName] = (pluginPlatformsFolderPath: string, pluginData: IPluginData): Promise<void> => {
					return Promise.resolve();
				};
			});

			const xcprojService = testInjector.resolve("xcprojService");
			xcprojService.getXcodeprojPath = () => {
				return join(__dirname, "files");
			};

			let pbxProj: any;
			iOSProjectService.savePbxProj = (project: any): Promise<void> => {
				pbxProj = project;
				return Promise.resolve();
			};

			const pluginPath = temp.mkdirSync("pluginDirectory");
			const samplePluginPlatformsFolderPath = join(pluginPath, "platforms", "ios");
			files.forEach(file => {
				const fullPath = join(samplePluginPlatformsFolderPath, file);
				fs.createDirectory(dirname(fullPath));
				fs.writeFile(fullPath, "");
			});

			const samplePluginData = {
				name: "testPlugin",
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				}
			};

			const projectData: IProjectData = testInjector.resolve("projectData");

			// Act
			await iOSProjectService.preparePluginNativeCode(samplePluginData, projectData);

			return pbxProj;
		};

		it("adds source files in Sources build phase", async () => {
			const sourceFileNames = [
				"src/Header.h", "src/ObjC.m",
				"src/nested/Header.hpp", "src/nested/Source.cpp", "src/nested/ObjCpp.mm",
				"src/nested/level2/Header2.hxx", "src/nested/level2/Source2.cxx", "src/nested/level2/Source3.c",
				"src/SomeOtherExtension.donotadd",
			];

			const projectName = "projectDirectory";
			const projectPath = temp.mkdirSync(projectName);
			const testInjector = createTestInjector(projectPath, projectName, xcode);
			const fs: IFileSystem = testInjector.resolve("fs");

			const platformsFolderPath = join(projectPath, "platforms", "ios");
			fs.createDirectory(platformsFolderPath);

			const pbxProj = await await getProjectWithoutPlugins(sourceFileNames);

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(key => pbxFileReference[key]);
			const buildPhaseFiles = pbxProj.hash.project.objects.PBXSourcesBuildPhase["858B83F218CA22B800AB12DE"].files;

			sourceFileNames.map(file => basename(file)).forEach(baseName => {
				const ext = extname(baseName);
				const shouldBeAdded = ext !== ".donotadd";
				assert.notEqual(pbxFileReferenceValues.indexOf(baseName), -1, `${baseName} not added to PBXFileRefereces`);

				const buildPhaseFile = buildPhaseFiles.find((fileObject: any) => fileObject.comment.startsWith(baseName));
				if (shouldBeAdded && !extname(baseName).startsWith(".h")) {
					assert.isDefined(buildPhaseFile, `${baseName} not added to PBXSourcesBuildPhase`);
					assert.include(buildPhaseFile.comment, "in Sources", `${baseName} must be added to Sources group`);
				} else {
					assert.isUndefined(buildPhaseFile, `${baseName} is added to PBXSourcesBuildPhase, but it shouldn't have been.`);
				}
			});
		});

		it("adds plugin with Source files", async () => {
			const sourceFileNames = [
				"src/Header.h", "src/ObjC.m",
				"src/nested/Header.hpp", "src/nested/Source.cpp", "src/nested/ObjCpp.mm",
				"src/nested/level2/Header2.hxx", "src/nested/level2/Source2.cxx", "src/nested/level2/Source3.c",
				"src/SomeOtherExtension.donotadd",
			];

			const pbxProj = await preparePluginWithFiles(sourceFileNames, "prepareNativeSourceCode");

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(key => pbxFileReference[key]);
			const buildPhaseFiles = pbxProj.hash.project.objects.PBXSourcesBuildPhase["858B83F218CA22B800AB12DE"].files;

			sourceFileNames.map(file => basename(file)).forEach(baseName => {
				const ext = extname(baseName);
				const shouldBeAdded = ext !== ".donotadd";
				assert.notEqual(pbxFileReferenceValues.indexOf(baseName), -1, `${baseName} not added to PBXFileRefereces`);

				const buildPhaseFile = buildPhaseFiles.find((fileObject: any) => fileObject.comment.startsWith(baseName));
				if (shouldBeAdded && !extname(baseName).startsWith(".h")) {
					assert.isDefined(buildPhaseFile, `${baseName} not added to PBXSourcesBuildPhase`);
					assert.include(buildPhaseFile.comment, "in Sources", `${baseName} must be added to Sources group`);
				} else {
					assert.isUndefined(buildPhaseFile, `${baseName} was added to PBXSourcesBuildPhase, but it shouldn't have been`);
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
				const dirName = dirname(filename);
				const fileToCheck = dirName.endsWith(".bundle") ? dirName : filename;
				const fileName = basename(fileToCheck);

				assert.isTrue(pbxFileReferenceValues.indexOf(fileName) !== -1, `Resource ${filename} not added to PBXFileRefereces`);

				const buildPhaseFile = buildPhaseFiles.find((fileObject: any) => fileObject.comment.startsWith(fileName));
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
	const staticLibraryPath = join(join(temp.mkdirSync("pluginDirectory"), "platforms", "ios"));
	const staticLibraryHeadersPath = join(staticLibraryPath, "include", libraryName);

	it("checks validation of header files", async () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, header => { fs.writeFile(join(staticLibraryHeadersPath, header), ""); });

		// Add all header files.
		fs.writeFile(join(staticLibraryHeadersPath, libraryName + ".a"), "");

		let error: any;
		try {
			await iOSProjectService.validateStaticLibrary(join(staticLibraryPath, libraryName + ".a"));
		} catch (err) {
			error = err;
		}

		assert.instanceOf(error, Error, "Expect to fail, the .a file is not a static library.");
	});

	it("checks generation of modulemaps", () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, header => { fs.writeFile(join(staticLibraryHeadersPath, header), ""); });

		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);
		// Read the generated modulemap and verify it.
		let modulemap = fs.readFile(join(staticLibraryHeadersPath, "module.modulemap"));
		const headerCommands = _.map(headers, value => `header "${value}"`);
		const modulemapExpectation = `module ${libraryName} { explicit module ${libraryName} { ${headerCommands.join(" ")} } }`;

		assert.equal(modulemap, modulemapExpectation);

		// Delete all header files. And try to regenerate modulemap.
		_.each(headers, header => { fs.deleteFile(join(staticLibraryHeadersPath, header)); });
		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);

		let error: any;
		try {
			modulemap = fs.readFile(join(staticLibraryHeadersPath, "module.modulemap"));
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
		const subpath = join(projectPath, "sub", "path");

		const testInjector = createTestInjector(projectPath, projectName);
		createPackageJson(testInjector, projectPath, projectName);
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		const projectData: IProjectData = testInjector.resolve("projectData");

		const result = iOSProjectService.getLibSubpathRelativeToProjectPath(subpath, projectData);
		assert.equal(result, join("..", "..", "sub", "path"));
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
		pbxproj = join(projectPath, `platforms/ios/${projectDirName}.xcodeproj/project.pbxproj`);
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
			console.log("CHANGES !!!! ", changes);
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
						},
						setManualSigningStyleByTargetProductType: () => ({}),
						setManualSigningStyleByTargetProductTypesList: () => ({}),
						setManualSigningStyleByTargetKey: () => ({})
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
						},
						setManualSigningStyleByTargetProductType: () => ({}),
						setManualSigningStyleByTargetProductTypesList: () => ({}),
						setManualSigningStyleByTargetKey: () => ({})
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
						},
						setManualSigningStyleByTargetProductType: () => ({}),
						setManualSigningStyleByTargetProductTypesList: () => ({}),
						setManualSigningStyleByTargetKey: () => ({})
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
		const service = <IXcconfigService>injector.resolve('xcconfigService');
		_.forOwn(expected, (value, key) => {
			const actual = service.readPropertyValue(xcconfigPath, key);
			assert.equal(actual, value);
		});
	};

	let projectName: string;
	let projectPath: string;
	let projectRoot: string;
	let testInjector: IInjector;
	let iOSProjectService: IOSProjectService;
	let projectData: IProjectData;
	let fs: IFileSystem;
	let appResourcesXcconfigPath: string;
	let appResourceXCConfigContent: string;
	let iOSEntitlementsService: IOSEntitlementsService;
	let xcconfigService: IXcconfigService;

	beforeEach(() => {
		projectName = "projectDirectory";
		projectPath = temp.mkdirSync(projectName);

		testInjector = createTestInjector(projectPath, projectName);
		iOSProjectService = testInjector.resolve("iOSProjectService");
		projectData = testInjector.resolve("projectData");
		projectData.projectDir = projectPath;
		projectData.appResourcesDirectoryPath = join(projectData.projectDir, "app", "App_Resources");

		iOSEntitlementsService = testInjector.resolve("iOSEntitlementsService");

		appResourcesXcconfigPath = join(projectData.appResourcesDirectoryPath, "iOS", BUILD_XCCONFIG_FILE_NAME);
		appResourceXCConfigContent = `CODE_SIGN_IDENTITY = iPhone Distribution
			// To build for device with XCode you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
			// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
			ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
			ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;
			`;
		const testPackageJson = {
			"name": "test-project",
			"version": "0.0.1"
		};
		fs = testInjector.resolve("fs");
		fs.writeJson(join(projectPath, "package.json"), testPackageJson);
		xcconfigService = testInjector.resolve("xcconfigService");
		projectRoot = iOSProjectService.getPlatformData(projectData).projectRoot;
	});

	it("Uses the build.xcconfig file content from App_Resources", async () => {
		// setup app_resource build.xcconfig
		fs.writeFile(appResourcesXcconfigPath, appResourceXCConfigContent);

		// run merge for all release: debug|release
		for (const release in [true, false]) {
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData, { release });

			const destinationFilePath = xcconfigService.getPluginsXcconfigFilePath(projectRoot, { release: !!release });

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

			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData, { release });

			const destinationFilePath = xcconfigService.getPluginsXcconfigFilePath(projectRoot, { release: !!release });

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
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData, { release });

			const destinationFilePath = xcconfigService.getPluginsXcconfigFilePath(projectRoot, { release: !!release });

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
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData, { release });

			const destinationFilePath = xcconfigService.getPluginsXcconfigFilePath(projectRoot, { release: !!release });

			assert.isTrue(fs.exists(destinationFilePath), 'Target build xcconfig is missing for release: ' + release);
			const content = fs.readFile(destinationFilePath).toString();
			assert.equal(content, "");
		}
	});
});

describe("buildProject", () => {
	let xcodeBuildCommandArgs: string[] = [];

	function setup(data: { frameworkVersion: string, deploymentTarget: string, devices?: Mobile.IDevice[] }): IInjector {
		const projectPath = "myTestProjectPath";
		const projectName = "myTestProjectName";
		const testInjector = createTestInjector(projectPath, projectName);

		const childProcess = testInjector.resolve("childProcess");
		childProcess.spawnFromEvent = (command: string, args: string[]) => {
			if (command === "xcodebuild" && args[0] !== "-exportArchive") {
				xcodeBuildCommandArgs = args;
			}
		};

		const projectDataService = testInjector.resolve("projectDataService");
		projectDataService.getNSValue = (projectDir: string, propertyName: string) => {
			if (propertyName === "tns-ios") {
				return {
					name: "tns-ios",
					version: data.frameworkVersion
				};
			}
		};

		const projectData = testInjector.resolve("projectData");
		projectData.appResourcesDirectoryPath = join(projectPath, "app", "App_Resources");

		const devicesService = testInjector.resolve("devicesService");
		devicesService.initialize = () => ({});
		devicesService.getDeviceInstances = () => data.devices || [];

		const xcconfigService = testInjector.resolve("xcconfigService");
		xcconfigService.readPropertyValue = (projectDir: string, propertyName: string) => {
			if (propertyName === "IPHONEOS_DEPLOYMENT_TARGET") {
				return data.deploymentTarget;
			}
		};

		const pbxprojDomXcode = testInjector.resolve("pbxprojDomXcode");
		pbxprojDomXcode.Xcode = {
			open: () => ({
				getSigning: () => ({}),
				setAutomaticSigningStyle: () => ({}),
				setAutomaticSigningStyleByTargetProductType: () => ({}),
				setAutomaticSigningStyleByTargetProductTypesList: () => ({}),
				setAutomaticSigningStyleByTargetKey: () => ({}),
				save: () => ({})
			})
		};

		const iOSProvisionService = testInjector.resolve("iOSProvisionService");
		iOSProvisionService.getDevelopmentTeams = () => ({});
		iOSProvisionService.getTeamIdsWithName = () => ({});

		return testInjector;
	}

	function executeTests(testCases: any[], data: { buildForDevice: boolean }) {
		_.each(testCases, testCase => {
			it(`${testCase.name}`, async () => {
				const testInjector = setup({ frameworkVersion: testCase.frameworkVersion, deploymentTarget: testCase.deploymentTarget });
				const projectData: IProjectData = testInjector.resolve("projectData");

				const iOSProjectService = <IOSProjectService>testInjector.resolve("iOSProjectService");
				(<any>iOSProjectService).getExportOptionsMethod = () => ({});
				await iOSProjectService.buildProject("myProjectRoot", projectData, <any>{ buildForDevice: data.buildForDevice });

				const archsItem = xcodeBuildCommandArgs.find(item => item.startsWith("ARCHS="));
				if (testCase.expectedArchs) {
					const archsValue = archsItem.split("=")[1];
					assert.deepEqual(archsValue, testCase.expectedArchs);
				} else {
					assert.deepEqual(undefined, archsItem);
				}
			});
		});
	}

	describe("for device", () => {
		afterEach(() => {
			xcodeBuildCommandArgs = [];
		});

		const testCases = <any[]>[{
			name: "shouldn't exclude armv7 architecture when deployment target 10",
			frameworkVersion: "5.0.0",
			deploymentTarget: "10.0",
			expectedArchs: "armv7 arm64"
		}, {
			name: "should exclude armv7 architecture when deployment target is 11",
			frameworkVersion: "5.0.0",
			deploymentTarget: "11.0",
			expectedArchs: "arm64"
		}, {
			name: "shouldn't pass architecture to xcodebuild command when frameworkVersion is 5.1.0",
			frameworkVersion: "5.1.0",
			deploymentTarget: "11.0"
		}, {
			name: "should pass only 64bit architecture to xcodebuild command when frameworkVersion is 5.0.0 and deployment target is 11.0",
			frameworkVersion: "5.0.0",
			deploymentTarget: "11.0",
			expectedArchs: "arm64"
		}, {
			name: "should pass both architectures to xcodebuild command when frameworkVersion is 5.0.0 and deployment target is 10.0",
			frameworkVersion: "5.0.0",
			deploymentTarget: "10.0",
			expectedArchs: "armv7 arm64"
		}, {
			name: "should pass both architectures to xcodebuild command when frameworkVersion is 5.0.0 and no deployment target",
			frameworkVersion: "5.0.0",
			deploymentTarget: null,
			expectedArchs: "armv7 arm64"
		}];

		executeTests(testCases, { buildForDevice: true });
	});

	describe("for simulator", () => {
		afterEach(() => {
			xcodeBuildCommandArgs = [];
		});

		const testCases = [{
			name: "shouldn't exclude i386 architecture when deployment target is 10",
			frameworkVersion: "5.0.0",
			deploymentTarget: "10.0",
			expectedArchs: "i386 x86_64"
		}, {
			name: "should exclude i386 architecture when deployment target is 11",
			frameworkVersion: "5.0.0",
			deploymentTarget: "11.0",
			expectedArchs: "x86_64"
		}, {
			name: "shouldn't pass architecture to xcodebuild command when frameworkVersion is 5.1.0",
			frameworkVersion: "5.1.0",
			deploymentTarget: "11.0"
		}, {
			name: "should pass only 64bit architecture to xcodebuild command when frameworkVersion is 5.0.0 and deployment target is 11.0",
			frameworkVersion: "5.0.0",
			deploymentTarget: "11.0",
			expectedArchs: "x86_64"
		}, {
			name: "should pass both architectures to xcodebuild command when frameworkVersion is 5.0.0 and deployment target is 10.0",
			frameworkVersion: "5.0.0",
			deploymentTarget: "10.0",
			expectedArchs: "i386 x86_64"
		}, {
			name: "should pass both architectures to xcodebuild command when frameworkVersion is 5.0.0 and no deployment target",
			frameworkVersion: "5.0.0",
			deploymentTarget: null,
			expectedArchs: "i386 x86_64"
		}];

		executeTests(testCases, { buildForDevice: false });
	});
});

describe("handleNativeDependenciesChange", () => {
	it("ensure the correct order of pod install and merging pod's xcconfig file", async () => {
		const executedCocoapodsMethods: string[] = [];
		const projectPodfilePath = "my/test/project/platforms/ios/Podfile";

		const testInjector = createTestInjector("myTestProjectPath", "myTestProjectName");
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		const projectData = testInjector.resolve("projectData");

		const cocoapodsService = testInjector.resolve("cocoapodsService");
		cocoapodsService.executePodInstall = async () => executedCocoapodsMethods.push("podInstall");
		cocoapodsService.mergePodXcconfigFile = async () => executedCocoapodsMethods.push("podMerge");
		cocoapodsService.applyPodfileFromAppResources = async () => ({});
		cocoapodsService.removeDuplicatedPlatfomsFromProjectPodFile = async () => ({});
		cocoapodsService.getProjectPodfilePath = () => projectPodfilePath;

		const fs = testInjector.resolve("fs");
		fs.exists = (filePath: string) => filePath === projectPodfilePath;

		await iOSProjectService.handleNativeDependenciesChange(projectData);

		assert.deepEqual(executedCocoapodsMethods, ["podInstall", "podMerge"]);
	});
});
