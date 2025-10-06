import { join, dirname, basename, extname } from "path";
import { EOL } from "os";
import * as _ from "lodash";
import * as ChildProcessLib from "../lib/common/child-process";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FileSystemLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as iOSProjectServiceLib from "../lib/services/ios-project-service";
import { IOSProjectService } from "../lib/services/ios-project-service";
import { IOSEntitlementsService } from "../lib/services/ios-entitlements-service";
import { XcconfigService } from "../lib/services/xcconfig-service";
import * as LoggerLib from "../lib/common/logger/logger";
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
import { Utils } from "../lib/common/utils";
import { CocoaPodsService } from "../lib/services/cocoapods-service";
import { PackageManager } from "../lib/package-manager";
import { NodePackageManager } from "../lib/node-package-manager";
import { YarnPackageManager } from "../lib/yarn-package-manager";

import { assert } from "chai";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { BUILD_XCCONFIG_FILE_NAME, PLATFORMS_DIR_NAME } from "../lib/constants";
import {
	ProjectDataStub,
	TempServiceStub,
	ProjectDataServiceStub,
	ProjectConfigServiceStub,
} from "./stubs";
import { xcode } from "../lib/node/xcode";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { CocoaPodsPlatformManager } from "../lib/services/cocoapods-platform-manager";
import { XcodebuildService } from "../lib/services/ios/xcodebuild-service";
import { XcodebuildCommandService } from "../lib/services/ios/xcodebuild-command-service";
import { XcodebuildArgsService } from "../lib/services/ios/xcodebuild-args-service";
import { ExportOptionsPlistService } from "../lib/services/ios/export-options-plist-service";
import { IOSSigningService } from "../lib/services/ios/ios-signing-service";
import { IProjectData } from "../lib/definitions/project";
import { IPluginData } from "../lib/definitions/plugins";
import { IXcconfigService } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { IStringDictionary, IFileSystem } from "../lib/common/declarations";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";

class IOSSimulatorDiscoveryMock extends DeviceDiscovery {
	public async startLookingForDevices(): Promise<void> {
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

function createTestInjector(
	projectPath: string,
	projectName: string,
	xCode?: IXcode,
): IInjector {
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
	testInjector.register(
		"iOSProjectService",
		iOSProjectServiceLib.IOSProjectService,
	);
	testInjector.register("iOSProvisionService", {});
	testInjector.register("xcconfigService", XcconfigService);
	testInjector.register("iOSEntitlementsService", IOSEntitlementsService);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("cocoaPodsPlatformManager", CocoaPodsPlatformManager);
	const projectData = Object.assign({}, ProjectDataStub, {
		platformsDir: join(projectPath, PLATFORMS_DIR_NAME),
		projectName: projectName,
		projectPath: projectPath,
		projectFilePath: join(projectPath, "package.json"),
		projectId: "",
		projectIdentifiers: { android: "", ios: "" },
		projectDir: "",
		appDirectoryPath: "",
		appResourcesDirectoryPath: "",
		getAppResourcesDirectoryPath: () => "",
		nsConfig: {
			overridePods: false,
		},
	});
	projectData.projectDir = mkdtempSync(path.join(tmpdir(), "projectDir-"));
	projectData.appDirectoryPath = join(projectData.projectDir, "app");
	projectData.appResourcesDirectoryPath = join(
		projectData.appDirectoryPath,
		"App_Resources",
	);
	testInjector.register("projectData", projectData);
	testInjector.register("projectHelper", {});
	testInjector.register("xcodeSelectService", {
		getXcodeVersion() {
			return {
				major: 14,
			};
		},
	});
	testInjector.register("staticConfig", ConfigLib.StaticConfig);
	testInjector.register("projectDataService", ProjectDataServiceStub);
	testInjector.register("prompter", {});
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("devicesService", DevicesService);
	testInjector.register("iOSDeviceDiscovery", IOSDeviceDiscovery);
	testInjector.register("iOSSimulatorDiscovery", IOSSimulatorDiscoveryMock);
	testInjector.register("iOSSimResolver", {});
	testInjector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);
	testInjector.register("messages", Messages);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("deviceLogProvider", DeviceLogProvider);
	testInjector.register("timelineProfilerService", {});
	testInjector.register("logFilter", LogFilter);
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("utils", Utils);
	testInjector.register("xcprojService", {
		getXcprojInfo: () => {
			return {
				shouldUseXcproj: false,
			};
		},
		getXcodeprojPath: (projData: IProjectData, projectRoot: string) => {
			return join(projectRoot, projData.projectName + ".xcodeproj");
		},
		checkIfXcodeprojIsRequired: () => ({}),
	});
	testInjector.register("iosDeviceOperations", {});
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: (): string[] => [],
		getAllProductionPlugins: (): string[] => [],
	});
	testInjector.register("androidProcessService", {});
	testInjector.register("sysInfo", {
		getXcodeVersion: async () => "",
	});
	testInjector.register("pbxprojDomXcode", {});
	testInjector.register(
		"xcode",
		xCode || {
			project: class {
				constructor() {
					/* */
				}
				parseSync() {
					/* */
				}
				pbxGroupByName() {
					/* */
				}
				removeTargetsByProductType() {
					/* */
				}
				writeSync() {
					return "";
				}
			},
		},
	);
	testInjector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<void> => undefined,
	});
	testInjector.register("packageManager", PackageManager);
	testInjector.register("projectConfigService", ProjectConfigServiceStub);
	testInjector.register("npm", NodePackageManager);
	testInjector.register("yarn", YarnPackageManager);
	testInjector.register("xcconfigService", XcconfigService);
	testInjector.register("settingsService", SettingsService);
	testInjector.register("httpClient", {});
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("plistParser", {});
	testInjector.register("androidEmulatorServices", {});
	testInjector.register("androidEmulatorDiscovery", {
		on: () => ({}),
	});
	testInjector.register("emulatorHelper", {});
	testInjector.register("filesHashService", {
		hasChangesInShasums: (
			oldPluginNativeHashes: IStringDictionary,
			currentPluginNativeHashes: IStringDictionary,
		) => true,
		generateHashes: async (files: string[]): Promise<IStringDictionary> => ({}),
	});
	testInjector.register("pacoteService", {
		extractPackage: async (
			packageName: string,
			destinationDirectory: string,
			options?: IPacoteExtractOptions,
		): Promise<void> => undefined,
	});
	testInjector.register("iOSExtensionsService", {
		removeExtensions: () => {
			/* */
		},
		addExtensionsFromPath: () => Promise.resolve(),
	});
	testInjector.register("timers", {});
	testInjector.register("iOSSigningService", IOSSigningService);
	testInjector.register("xcodebuildService", XcodebuildService);
	testInjector.register("xcodebuildCommandService", XcodebuildCommandService);
	testInjector.register("xcodebuildArgsService", XcodebuildArgsService);
	testInjector.register("exportOptionsPlistService", ExportOptionsPlistService);

	testInjector.register("iOSWatchAppService", {
		removeWatchApp: () => {
			/* */
		},
		addWatchAppFromPath: () => Promise.resolve(),
	});

	testInjector.register("logSourceMapService", {
		replaceWithOriginalFileLocations: (platform: string, message: string) =>
			message,
	});
	testInjector.register("iOSNativeTargetService", {
		setXcodeTargetBuildConfigurationProperties: () => {
			/* */
		},
	});
	testInjector.register("tempService", TempServiceStub);
	testInjector.register("spmService", {
		applySPMPackages: () => Promise.resolve(),
	});

	return testInjector;
}

function createPackageJson(
	testInjector: IInjector,
	projectPath: string,
	projectName: string,
) {
	const packageJsonData = {
		name: projectName,
		version: "0.1.0",
		dependencies: {
			"@nativescript/core": "7.0.0",
		},
		devDependencies: {
			"@nativescript/ios": "7.0.0",
			"@nativescript/android": "7.0.0",
		},
	};
	testInjector
		.resolve("fs")
		.writeJson(join(projectPath, "package.json"), packageJsonData);
}

describe("Cocoapods support", () => {
	if (require("os").platform() !== "darwin") {
		console.log("Skipping Cocoapods tests. They cannot work on windows");
	} else {
		// const expectedArchExclusions = (projectPath: string) =>
		// 	[
		// 		``,
		// 		`post_install do |installer|`,
		// 		`  post_installNativeScript_CLI_Architecture_Exclusions_0 installer`,
		// 		`end`,
		// 		``,
		// 		`# Begin Podfile - ${projectPath}/platforms/ios/Podfile-exclusions`,
		// 		`def post_installNativeScript_CLI_Architecture_Exclusions_0 (installer)`,
		// 		`  installer.pods_project.build_configurations.each do |config|`,
		// 		`    config.build_settings.delete "VALID_ARCHS"`,
		// 		`    config.build_settings["EXCLUDED_ARCHS_x86_64"] = "arm64 arm64e"`,
		// 		`    config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "i386 armv6 armv7 armv7s armv8 $(EXCLUDED_ARCHS_$(NATIVE_ARCH_64_BIT))"`,
		// 		`    config.build_settings["EXCLUDED_ARCHS[sdk=iphoneos*]"] = "i386 armv6 armv7 armv7s armv8 x86_64"`,
		// 		`  end`,
		// 		`end`,
		// 		`# End Podfile`,
		// 	].join("\n");

		it("adds а base Podfile", async () => {
			const projectName = "projectDirectory";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");
			const cocoapodsService = testInjector.resolve("cocoapodsService");

			// const packageJsonData = {
			// 	"name": "myProject",
			// 	"version": "0.1.0",
			// 	"nativescript": {
			// 		"id": "org.nativescript.myProject",
			// 		"tns-ios": {
			// 			"version": "1.0.0"
			// 		}
			// 	}
			// };
			// fs.writeJson(join(projectPath, "package.json"), packageJsonData);
			createPackageJson(testInjector, projectPath, "myProject");

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => {
						return {};
					},
					pbxXCBuildConfigurationSection: () => {
						return {};
					},
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const projectData: IProjectData = testInjector.resolve("projectData");
			const basePodfileModuleName = "BasePodfile";

			const basePodfilePath = join(
				projectData.appDirectoryPath,
				"App_Resources",
				"iOS",
				"Podfile",
			);
			const pluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			fs.writeFile(basePodfilePath, pluginPodfileContent);

			projectData.podfilePath = basePodfilePath;

			await cocoapodsService.applyPodfileToProject(
				basePodfileModuleName,
				basePodfilePath,
				projectData,
				iOSProjectService.getPlatformData(projectData),
			);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(
				fs.exists(projectPodfilePath),
				`File ${projectPodfilePath} must exist as we have already applied Podfile to it.`,
			);

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"# platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${basePodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection\n",
			].join("\n");
			const expectedProjectPodfileContent = [
				"use_frameworks!\n",
				`target "${projectName}" do`,
				expectedPlatformSection,
				`# Begin Podfile - ${basePodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile",
				"end",
			].join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			fs.deleteFile(basePodfilePath);

			await cocoapodsService.applyPodfileToProject(
				basePodfileModuleName,
				basePodfilePath,
				projectData,
				iOSProjectService.getPlatformData(projectData),
			);
			assert.isFalse(
				fs.exists(projectPodfilePath),
				`The projectPodfilePath (${projectPodfilePath}) must not exist when all Podfiles have been deleted and project is prepared again. (i.e. CLI should delete the project Podfile in this case)`,
			);
		});

		it("adds plugin with Podfile", async () => {
			const projectName = "projectDirectory";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				name: "myProject",
				version: "0.1.0",
				nativescript: {
					id: "org.nativescript.myProject",
					"tns-ios": {
						version: "1.0.0",
					},
				},
			};
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (
				pluginPlatformsFolderPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.prepareStaticLibs = (
				pluginPlatformsFolderPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => {
						return {};
					},
					pbxXCBuildConfigurationSection: () => {
						return {};
					},
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const pluginPath = mkdtempSync(path.join(tmpdir(), "pluginDirectory-"));
			const samplePluginPlatformsFolderPath = join(
				pluginPath,
				PLATFORMS_DIR_NAME,
				"ios",
			);
			const pluginPodfilePath = join(
				samplePluginPlatformsFolderPath,
				"Podfile",
			);
			const pluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const samplePluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				},
				name: "somePlugin",
			};
			const projectData: IProjectData = testInjector.resolve("projectData");
			const pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllProductionPlugins = () => {
				return [samplePluginData];
			};
			const cocoapodsService = testInjector.resolve("cocoapodsService");
			cocoapodsService.executePodInstall = async () => {
				/* */
			};

			await iOSProjectService.handleNativeDependenciesChange(projectData);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			const actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"# platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${pluginPodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection\n",
			].join("\n");

			const expectedProjectPodfileContent = [
				"use_frameworks!\n",
				`target "${projectName}" do`,
				expectedPlatformSection,
				`# Begin Podfile - ${pluginPodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile",
				// only on xcode 12
				// expectedArchExclusions(projectPath),
				"end",
			].join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);
		});
		it("adds and removes plugin with Podfile", async () => {
			const projectName = "projectDirectory2";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

			const testInjector = createTestInjector(projectPath, projectName);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				name: "myProject2",
				version: "0.1.0",
				nativescript: {
					id: "org.nativescript.myProject2",
					"tns-ios": {
						version: "1.0.0",
					},
				},
			};
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");
			iOSProjectService.prepareFrameworks = (
				pluginPlatformsPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.prepareStaticLibs = (
				pluginPlatformsPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeFrameworks = (
				pluginPlatformsPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.removeStaticLibs = (
				pluginPlatformsPath: string,
				pluginData: IPluginData,
			): Promise<void> => {
				return Promise.resolve();
			};
			iOSProjectService.createPbxProj = () => {
				return {
					updateBuildProperty: () => {
						return {};
					},
					pbxXCBuildConfigurationSection: () => {
						return {};
					},
					removePbxGroup: () => {
						return {};
					},
					removeFromHeaderSearchPaths: () => {
						return {};
					},
				};
			};
			iOSProjectService.savePbxProj = (): Promise<void> => Promise.resolve();

			const pluginPath = mkdtempSync(path.join(tmpdir(), "pluginDirectory-"));
			const samplePluginPlatformsFolderPath = join(
				pluginPath,
				PLATFORMS_DIR_NAME,
				"ios",
			);
			const pluginPodfilePath = join(
				samplePluginPlatformsFolderPath,
				"Podfile",
			);
			const pluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			fs.writeFile(pluginPodfilePath, pluginPodfileContent);

			const samplePluginData = {
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				},
				name: "pluginName",
				fullPath: "fullPath",
			};
			const projectData: IProjectData = testInjector.resolve("projectData");
			const pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllProductionPlugins = () => {
				return [samplePluginData];
			};
			const cocoapodsService = testInjector.resolve("cocoapodsService");
			cocoapodsService.executePodInstall = async () => {
				/* */
			};

			await iOSProjectService.handleNativeDependenciesChange(projectData);

			const projectPodfilePath = join(platformsFolderPath, "Podfile");
			assert.isTrue(fs.exists(projectPodfilePath));

			let actualProjectPodfileContent = fs.readText(projectPodfilePath);
			const expectedPluginPodfileContent = [
				"source 'https://github.com/CocoaPods/Specs.git'",
				"# platform :ios, '8.1'",
				"pod 'GoogleMaps'",
			].join("\n");
			const expectedPlatformSection = [
				`# NativeScriptPlatformSection ${pluginPodfilePath} with 8.1`,
				"platform :ios, '8.1'",
				"# End NativeScriptPlatformSection\n",
			].join("\n");
			const expectedProjectPodfileContent = [
				"use_frameworks!\n",
				`target "${projectName}" do`,
				expectedPlatformSection,
				`# Begin Podfile - ${pluginPodfilePath}`,
				expectedPluginPodfileContent,
				"# End Podfile",
				// only on XCode 12
				// expectedArchExclusions(projectPath),
				"end",
			].join("\n");
			assert.equal(actualProjectPodfileContent, expectedProjectPodfileContent);

			await iOSProjectService.removePluginNativeCode(
				samplePluginData,
				projectData,
			);

			assert.isFalse(fs.exists(projectPodfilePath));

			// only on xcode12
			// const expectedProjectPodfileContentAfter = [
			// 	"use_frameworks!\n",
			// 	`target "${projectName}" do`,
			// 	"",
			//  expectedArchExclusions(projectPath),
			// 	"end",
			// ].join("\n");
			// actualProjectPodfileContent = fs.readText(projectPodfilePath);
			// assert.equal(
			// 	actualProjectPodfileContent,
			// 	expectedProjectPodfileContentAfter
			// );
		});
	}
});

describe("Source code support", () => {
	if (require("os").platform() !== "darwin") {
		console.log(
			"Skipping Source code in plugin tests. They cannot work on windows",
		);
	} else {
		const getProjectWithoutPlugins = async (files: string[]) => {
			// Arrange
			const projectName = "projectDirectory";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));
			const testInjector = createTestInjector(projectPath, projectName, xcode);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				name: "myProject",
				version: "0.1.0",
				nativescript: {
					id: "org.nativescript.myProject",
					"tns-ios": {
						version: "1.0.0",
					},
				},
			};
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
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

			const platformSpecificAppResourcesPath = join(
				projectData.appResourcesDirectoryPath,
				iOSProjectService.getPlatformData(projectData).normalizedPlatformName,
			);

			files.forEach((file) => {
				const fullPath = join(platformSpecificAppResourcesPath, file);
				fs.createDirectory(dirname(fullPath));
				fs.writeFile(fullPath, "");
			});

			await iOSProjectService.prepareNativeSourceCode(
				"src",
				platformSpecificAppResourcesPath,
				projectData,
			);

			return pbxProj;
		};

		const preparePluginWithFiles = async (
			files: string[],
			prepareMethodToCall: string,
		) => {
			// Arrange
			const projectName = "projectDirectory";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));
			const testInjector = createTestInjector(projectPath, projectName, xcode);
			const fs: IFileSystem = testInjector.resolve("fs");

			const packageJsonData = {
				name: "myProject",
				version: "0.1.0",
				nativescript: {
					id: "org.nativescript.myProject",
					"tns-ios": {
						version: "1.0.0",
					},
				},
			};
			fs.writeJson(join(projectPath, "package.json"), packageJsonData);

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
			fs.createDirectory(platformsFolderPath);

			const iOSProjectService = testInjector.resolve("iOSProjectService");

			const mockPrepareMethods = [
				"prepareFrameworks",
				"prepareStaticLibs",
				"prepareResources",
				"prepareNativeSourceCode",
			];

			mockPrepareMethods
				.filter((m) => m !== prepareMethodToCall)
				.forEach((methodName) => {
					iOSProjectService[methodName] = (
						pluginPlatformsFolderPath: string,
						pluginData: IPluginData,
					): Promise<void> => {
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

			const pluginPath = mkdtempSync(path.join(tmpdir(), "pluginDirectory-"));
			const samplePluginPlatformsFolderPath = join(
				pluginPath,
				PLATFORMS_DIR_NAME,
				"ios",
			);
			files.forEach((file) => {
				const fullPath = join(samplePluginPlatformsFolderPath, file);
				fs.createDirectory(dirname(fullPath));
				fs.writeFile(fullPath, "");
			});

			const samplePluginData = {
				name: "testPlugin",
				pluginPlatformsFolderPath(platform: string): string {
					return samplePluginPlatformsFolderPath;
				},
			};

			const projectData: IProjectData = testInjector.resolve("projectData");

			// Act
			await iOSProjectService.preparePluginNativeCode(
				samplePluginData,
				projectData,
			);

			return pbxProj;
		};

		it("adds source files in Sources build phase", async () => {
			const sourceFileNames = [
				"src/Header.h",
				"src/ObjC.m",
				"src/nested/Header.hpp",
				"src/nested/Source.cpp",
				"src/nested/ObjCpp.mm",
				"src/nested/level2/Header2.hxx",
				"src/nested/level2/Source2.cxx",
				"src/nested/level2/Source3.c",
				"src/SomeOtherExtension.donotadd",
			];

			const projectName = "projectDirectory";
			const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));
			const testInjector = createTestInjector(projectPath, projectName, xcode);
			const fs: IFileSystem = testInjector.resolve("fs");

			const platformsFolderPath = join(projectPath, PLATFORMS_DIR_NAME, "ios");
			fs.createDirectory(platformsFolderPath);

			const pbxProj = await await getProjectWithoutPlugins(sourceFileNames);

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(
				(key) => pbxFileReference[key],
			);
			const buildPhaseFiles =
				pbxProj.hash.project.objects.PBXSourcesBuildPhase[
					"858B83F218CA22B800AB12DE"
				].files;

			sourceFileNames
				.map((file) => basename(file))
				.forEach((baseName) => {
					const ext = extname(baseName);
					const shouldBeAdded = ext !== ".donotadd";
					assert.notEqual(
						pbxFileReferenceValues.indexOf(baseName),
						-1,
						`${baseName} not added to PBXFileRefereces`,
					);

					const buildPhaseFile = buildPhaseFiles.find((fileObject: any) =>
						fileObject.comment.startsWith(baseName),
					);
					if (shouldBeAdded && !extname(baseName).startsWith(".h")) {
						assert.isDefined(
							buildPhaseFile,
							`${baseName} not added to PBXSourcesBuildPhase`,
						);
						assert.include(
							buildPhaseFile.comment,
							"in Sources",
							`${baseName} must be added to Sources group`,
						);
					} else {
						assert.isUndefined(
							buildPhaseFile,
							`${baseName} is added to PBXSourcesBuildPhase, but it shouldn't have been.`,
						);
					}
				});
		});

		it("adds plugin with Source files", async () => {
			const sourceFileNames = [
				"src/Header.h",
				"src/ObjC.m",
				"src/nested/Header.hpp",
				"src/nested/Source.cpp",
				"src/nested/ObjCpp.mm",
				"src/nested/level2/Header2.hxx",
				"src/nested/level2/Source2.cxx",
				"src/nested/level2/Source3.c",
				"src/SomeOtherExtension.donotadd",
			];

			const pbxProj = await preparePluginWithFiles(
				sourceFileNames,
				"prepareNativeSourceCode",
			);

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(
				(key) => pbxFileReference[key],
			);
			const buildPhaseFiles =
				pbxProj.hash.project.objects.PBXSourcesBuildPhase[
					"858B83F218CA22B800AB12DE"
				].files;

			sourceFileNames
				.map((file) => basename(file))
				.forEach((baseName) => {
					const ext = extname(baseName);
					const shouldBeAdded = ext !== ".donotadd";
					assert.notEqual(
						pbxFileReferenceValues.indexOf(baseName),
						-1,
						`${baseName} not added to PBXFileRefereces`,
					);

					const buildPhaseFile = buildPhaseFiles.find((fileObject: any) =>
						fileObject.comment.startsWith(baseName),
					);
					if (shouldBeAdded && !extname(baseName).startsWith(".h")) {
						assert.isDefined(
							buildPhaseFile,
							`${baseName} not added to PBXSourcesBuildPhase`,
						);
						assert.include(
							buildPhaseFile.comment,
							"in Sources",
							`${baseName} must be added to Sources group`,
						);
					} else {
						assert.isUndefined(
							buildPhaseFile,
							`${baseName} was added to PBXSourcesBuildPhase, but it shouldn't have been`,
						);
					}
				});
		});
		it("adds plugin with Resource files", async () => {
			const resFileNames = [
				"Resources/Image.png",
				"Resources/Jpeg.jpg",
				"Resources/screen.xib",
				"Resources/TestBundle.bundle/bundled.png",
			];

			const pbxProj = await preparePluginWithFiles(
				resFileNames,
				"prepareResources",
			);

			const pbxFileReference = pbxProj.hash.project.objects.PBXFileReference;
			const pbxFileReferenceValues = Object.keys(pbxFileReference).map(
				(key) => pbxFileReference[key],
			);
			const buildPhaseFiles =
				pbxProj.hash.project.objects.PBXResourcesBuildPhase[
					"858B842C18CA22B800AB12DE"
				].files;

			resFileNames.forEach((filename) => {
				const dirName = dirname(filename);
				const fileToCheck = dirName.endsWith(".bundle") ? dirName : filename;
				const fileName = basename(fileToCheck);

				assert.isTrue(
					pbxFileReferenceValues.indexOf(fileName) !== -1,
					`Resource ${filename} not added to PBXFileRefereces`,
				);

				const buildPhaseFile = buildPhaseFiles.find((fileObject: any) =>
					fileObject.comment.startsWith(fileName),
				);
				assert.isDefined(
					buildPhaseFile,
					`${fileToCheck} not added to PBXResourcesBuildPhase`,
				);
				assert.include(
					buildPhaseFile.comment,
					"in Resources",
					`${fileToCheck} must be added to Resources group`,
				);
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
	const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));
	const libraryName = "testLibrary1";
	const headers = ["TestHeader1.h", "TestHeader2.h"];
	const testInjector = createTestInjector(projectPath, projectName);
	const fs: IFileSystem = testInjector.resolve("fs");
	const staticLibraryPath = join(
		join(
			mkdtempSync(path.join(tmpdir(), "pluginDirectory-")),
			PLATFORMS_DIR_NAME,
			"ios",
		),
	);
	const staticLibraryHeadersPath = join(
		staticLibraryPath,
		"include",
		libraryName,
	);

	it("checks validation of header files", async () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, (header) => {
			fs.writeFile(join(staticLibraryHeadersPath, header), "");
		});

		// Add all header files.
		fs.writeFile(join(staticLibraryHeadersPath, libraryName + ".a"), "");

		let error: any;
		try {
			await iOSProjectService.validateStaticLibrary(
				join(staticLibraryPath, libraryName + ".a"),
			);
		} catch (err) {
			error = err;
		}

		assert.instanceOf(
			error,
			Error,
			"Expect to fail, the .a file is not a static library.",
		);
	});

	it("checks generation of modulemaps", () => {
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		fs.ensureDirectoryExists(staticLibraryHeadersPath);
		_.each(headers, (header) => {
			fs.writeFile(join(staticLibraryHeadersPath, header), "");
		});

		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);
		// Read the generated modulemap and verify it.
		let modulemap = fs.readFile(
			join(staticLibraryHeadersPath, "module.modulemap"),
		);
		const headerCommands = _.map(headers, (value) => `header "${value}"`);
		const modulemapExpectation = `module ${libraryName} { explicit module ${libraryName} { ${headerCommands.join(
			" ",
		)} } }`;

		assert.equal(modulemap, modulemapExpectation);

		// Delete all header files. And try to regenerate modulemap.
		_.each(headers, (header) => {
			fs.deleteFile(join(staticLibraryHeadersPath, header));
		});
		iOSProjectService.generateModulemap(staticLibraryHeadersPath, libraryName);

		let error: any;
		try {
			modulemap = fs.readFile(
				join(staticLibraryHeadersPath, "module.modulemap"),
			);
		} catch (err) {
			error = err;
		}

		assert.instanceOf(
			error,
			Error,
			"Expect to fail, there shouldn't be a module.modulemap file.",
		);
	});
});

describe("Relative paths", () => {
	it("checks for correct calculation of relative paths", () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));
		const subpath = join(projectPath, "sub", "path");

		const testInjector = createTestInjector(projectPath, projectName);
		createPackageJson(testInjector, projectPath, projectName);
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		const projectData: IProjectData = testInjector.resolve("projectData");

		const result = iOSProjectService.getLibSubpathRelativeToProjectPath(
			subpath,
			projectData,
		);
		assert.equal(result, join("..", "..", "sub", "path"));
	});
});

describe("Merge Project XCConfig files", () => {
	if (require("os").platform() !== "darwin") {
		console.log(
			"Skipping 'Merge Project XCConfig files' tests. They can work only on macOS",
		);
		return;
	}
	const assertPropertyValues = (
		expected: any,
		xcconfigPath: string,
		injector: IInjector,
	) => {
		const service = <IXcconfigService>injector.resolve("xcconfigService");
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
		projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		testInjector = createTestInjector(projectPath, projectName);
		iOSProjectService = testInjector.resolve("iOSProjectService");
		projectData = testInjector.resolve("projectData");
		projectData.projectDir = projectPath;
		projectData.appResourcesDirectoryPath = join(
			projectData.projectDir,
			"app",
			"App_Resources",
		);

		iOSEntitlementsService = testInjector.resolve("iOSEntitlementsService");

		appResourcesXcconfigPath = join(
			projectData.appResourcesDirectoryPath,
			"iOS",
			BUILD_XCCONFIG_FILE_NAME,
		);
		appResourceXCConfigContent = `CODE_SIGN_IDENTITY = iPhone Distribution
			// To build for device with XCode you need to specify your development team. More info: https://developer.apple.com/library/prerelease/content/releasenotes/DeveloperTools/RN-Xcode/Introduction.html
			// DEVELOPMENT_TEAM = YOUR_TEAM_ID;
			ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
			ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME = LaunchImage;
			`;
		const testPackageJson = {
			name: "test-project",
			version: "0.0.1",
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
			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData);

			const destinationFilePaths =
				xcconfigService.getPluginsXcconfigFilePaths(projectRoot);

			_.each(destinationFilePaths, (destinationFilePath) => {
				assert.isTrue(
					fs.exists(destinationFilePath),
					"Target build xcconfig is missing for release: " + release,
				);
				const expected = {
					ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
					ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME: "LaunchImage",
					CODE_SIGN_IDENTITY: "iPhone Distribution",
				};
				assertPropertyValues(expected, destinationFilePath, testInjector);
			});
		}
	});

	it("Adds the entitlements property if not set by the user", async () => {
		for (const release in [true, false]) {
			const realExistsFunction = testInjector.resolve("fs").exists;

			testInjector.resolve("fs").exists = (filePath: string) => {
				if (
					iOSEntitlementsService.getPlatformsEntitlementsPath(projectData) ===
					filePath
				) {
					return true;
				}

				return realExistsFunction(filePath);
			};

			await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData, {
				release,
			});

			const destinationFilePaths =
				xcconfigService.getPluginsXcconfigFilePaths(projectRoot);

			_.each(destinationFilePaths, (destinationFilePath) => {
				assert.isTrue(
					fs.exists(destinationFilePath),
					"Target build xcconfig is missing for release: " + release,
				);
				const expected = {
					CODE_SIGN_ENTITLEMENTS:
						iOSEntitlementsService.getPlatformsEntitlementsRelativePath(
							projectData,
						),
				};
				assertPropertyValues(expected, destinationFilePath, testInjector);
			});
		}
	});

	it("The user specified entitlements property takes precedence", async () => {
		// setup app_resource build.xcconfig
		const expectedEntitlementsFile = "user.entitlements";
		const xcconfigEntitlements =
			appResourceXCConfigContent +
			`${EOL}CODE_SIGN_ENTITLEMENTS = ${expectedEntitlementsFile}`;
		fs.writeFile(appResourcesXcconfigPath, xcconfigEntitlements);

		await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData);

		const destinationFilePaths =
			xcconfigService.getPluginsXcconfigFilePaths(projectRoot);

		_.each(destinationFilePaths, (destinationFilePath) => {
			assert.isTrue(
				fs.exists(destinationFilePath),
				`Target build xcconfig ${destinationFilePath} is missing.`,
			);
			const expected = {
				ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
				ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME: "LaunchImage",
				CODE_SIGN_IDENTITY: "iPhone Distribution",
				CODE_SIGN_ENTITLEMENTS: expectedEntitlementsFile,
			};
			assertPropertyValues(expected, destinationFilePath, testInjector);
		});
	});

	it("creates empty plugins-<config>.xcconfig in case there are no build.xcconfig in App_Resources and in plugins", async () => {
		await (<any>iOSProjectService).mergeProjectXcconfigFiles(projectData);

		const destinationFilePaths =
			xcconfigService.getPluginsXcconfigFilePaths(projectRoot);

		_.each(destinationFilePaths, (destinationFilePath) => {
			assert.isTrue(
				fs.exists(destinationFilePath),
				`Target build xcconfig ${destinationFilePath} is missing.`,
			);
			const content = fs.readFile(destinationFilePath).toString();
			assert.equal(content, "");
		});
	});
});

describe("handleNativeDependenciesChange", () => {
	it("ensure the correct order of pod install and merging pod's xcconfig file", async () => {
		const executedCocoapodsMethods: string[] = [];
		const projectPodfilePath = "my/test/project/platforms/ios/Podfile";
		const dir = mkdtempSync(path.join(tmpdir(), "myTestProjectPath-"));

		const testInjector = createTestInjector(dir, "myTestProjectName");
		const iOSProjectService = testInjector.resolve("iOSProjectService");
		const projectData = testInjector.resolve("projectData");

		const cocoapodsService = testInjector.resolve("cocoapodsService");
		cocoapodsService.executePodInstall = async () =>
			executedCocoapodsMethods.push("podInstall");
		cocoapodsService.mergePodXcconfigFile = async () =>
			executedCocoapodsMethods.push("podMerge");
		cocoapodsService.applyPodfileFromAppResources = async () => ({});
		cocoapodsService.removeDuplicatedPlatfomsFromProjectPodFile =
			async () => ({});
		cocoapodsService.getProjectPodfilePath = () => projectPodfilePath;

		const fs = testInjector.resolve("fs");
		fs.readText = (filePath: string) => "";
		fs.exists = (filePath: string) => filePath === projectPodfilePath;

		await iOSProjectService.handleNativeDependenciesChange(projectData);

		assert.deepStrictEqual(executedCocoapodsMethods, [
			"podInstall",
			"podMerge",
		]);
	});
});

describe("SPM Packages", () => {
	it("should add SPM packages to the project", async () => {
		// todo: add tests for SPM packages
	});
});
