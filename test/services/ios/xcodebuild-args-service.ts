import { Yok } from "../../../lib/common/yok";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";
import { XcodebuildArgsService } from "../../../lib/services/ios/xcodebuild-args-service";
import * as path from "path";
import * as _ from "lodash";
import { assert } from "chai";
import { IInjector } from "../../../lib/common/definitions/yok";
import { XcconfigService } from "../../../lib/services/xcconfig-service";

function createTestInjector(data: {
	logLevel: string;
	hasProjectWorkspace: boolean;
	connectedDevices?: any[];
}): IInjector {
	const injector = new Yok();
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("devicesService", {
		initialize: async () => ({}),
		getDevicesForPlatform: () => data.connectedDevices || [],
	});
	injector.register("fs", {
		exists: () => data.hasProjectWorkspace,
		readText: () => "",
	});
	injector.register("logger", {
		getLevel: () => data.logLevel,
	});
	injector.register("xcodebuildArgsService", XcodebuildArgsService);
	injector.register("childProcess", {});
	injector.register("xcconfigService", XcconfigService);
	injector.register("iOSWatchAppService", {
		hasWatchApp: () => false,
	});

	return injector;
}

const projectRoot = "path/to/my/app/folder/platforms/ios";
const normalizedPlatformName = "iOS";
const appResourcesDirectoryPath = "App_Resources";
const projectName = "myApp";
const buildOutputPath = path.join(projectRoot, projectName, "archive");

function getCommonArgs() {
	return [
		"BUILD_DIR=" + path.join(projectRoot, "build"),
		"SHARED_PRECOMPS_DIR=" + path.join(projectRoot, "build", "sharedpch"),
	];
}

function getXcodeProjectArgs(data?: { hasProjectWorkspace: boolean }) {
	const extraArgs = ["-scheme", projectName, "-skipPackagePluginValidation"];
	return data && data.hasProjectWorkspace
		? [
				"-workspace",
				path.join(projectRoot, `${projectName}.xcworkspace`),
				...extraArgs,
			]
		: [
				"-project",
				path.join(projectRoot, `${projectName}.xcodeproj`),
				...extraArgs,
			];
}

function getBuildLoggingArgs(logLevel: string): string[] {
	if (logLevel === "INFO") {
		return ["-quiet"];
	}

	return [];
}

describe("xcodebuildArgsService", () => {
	describe("getBuildForSimulatorArgs", () => {
		_.each([true, false], (hasProjectWorkspace) => {
			_.each(["INFO", "TRACE"], (logLevel) => {
				_.each(["Debug", "Release"], (configuration) => {
					_.each(["iOS", "visionOS"], (platform) => {
						it(`should return correct args when workspace is ${hasProjectWorkspace} with ${logLevel} log level and ${configuration} configuration (platform = ${platform})`, async () => {
							const injector = createTestInjector({
								logLevel,
								hasProjectWorkspace,
							});

							const buildConfig = {
								buildForDevice: false,
								release: configuration === "Release",
								platform,
							};
							const xcodebuildArgsService = injector.resolve(
								"xcodebuildArgsService",
							);
							const actualArgs =
								await xcodebuildArgsService.getBuildForSimulatorArgs(
									{ projectRoot, normalizedPlatformName },
									{ projectName, appResourcesDirectoryPath },
									buildConfig,
								);

							const expectedArgs = [
								`ONLY_ACTIVE_ARCH=${platform === "visionOS" ? "YES" : "NO"}`,
								...(platform === "visionOS" ? ["EXCLUDED_ARCHS=x86_64"] : []),
								"CODE_SIGN_IDENTITY=",
								"-destination",
								platform === "visionOS"
									? "generic/platform=visionOS Simulator"
									: "generic/platform=iOS Simulator",
								"build",
								"-configuration",
								configuration,
								"-sdk",
								platform === "visionOS" ? "xrsimulator" : "iphonesimulator",
							]
								.concat(getCommonArgs())
								.concat(getBuildLoggingArgs(logLevel))
								.concat(getXcodeProjectArgs({ hasProjectWorkspace }));

							assert.deepStrictEqual(actualArgs, expectedArgs);
						});
					});
				});
			});
		});
	});
	describe("getBuildForDeviceArgs", () => {
		const testCases = [
			{
				name: "should return correct args when there are more than one connected device",
				connectedDevices: [
					{ deviceInfo: { activeArchitecture: "arm64" } },
					{ deviceInfo: { activeArchitecture: "armv7" } },
				],
				expectedArgs: ["ONLY_ACTIVE_ARCH=NO", "-sdk", "iphoneos"].concat(
					getCommonArgs(),
				),
			},
			{
				name: "should return correct args when there is only one connected device",
				connectedDevices: [{ deviceInfo: { activeArchitecture: "arm64" } }],
				expectedArgs: ["-sdk", "iphoneos"].concat(getCommonArgs()),
			},
			{
				name: "should return correct args when no connected devices",
				connectedDevices: [],
				expectedArgs: ["-sdk", "iphoneos"].concat(getCommonArgs()),
			},
		];

		_.each(testCases, (testCase) => {
			_.each([true, false], (hasProjectWorkspace) => {
				_.each(["INFO", "TRACE"], (logLevel) => {
					_.each(["Debug", "Release"], (configuration) => {
						it(`${testCase.name} when hasProjectWorkspace is ${hasProjectWorkspace} with ${logLevel} log level and ${configuration} configuration`, async () => {
							const injector = createTestInjector({
								logLevel,
								hasProjectWorkspace,
								connectedDevices: testCase.connectedDevices,
							});

							const platformData = {
								projectRoot,
								normalizedPlatformName,
								getBuildOutputPath: () => buildOutputPath,
							};
							const projectData = {
								projectName,
								appResourcesDirectoryPath,
							};
							const buildConfig = {
								buildForDevice: true,
								release: configuration === "Release",
								platform: "ios",
							};
							const xcodebuildArgsService: IXcodebuildArgsService =
								injector.resolve("xcodebuildArgsService");
							const actualArgs =
								await xcodebuildArgsService.getBuildForDeviceArgs(
									<any>platformData,
									<any>projectData,
									<any>buildConfig,
								);

							const expectedArgs = [
								"-destination",
								"generic/platform=iOS",
								"archive",
								"-archivePath",
								path.join(buildOutputPath, `${projectName}.xcarchive`),
								"-configuration",
								configuration,
								"-allowProvisioningUpdates",
							]
								.concat(getXcodeProjectArgs({ hasProjectWorkspace }))
								.concat(testCase.expectedArgs)
								.concat(getBuildLoggingArgs(logLevel));

							assert.deepStrictEqual(actualArgs, expectedArgs);
						});
					});
				});
			});
		});
	});
});
