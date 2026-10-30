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
	buildXcconfigContent?: string;
	hostProjectPath?: string;
}): IInjector {
	const injector = new Yok();
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("devicesService", {
		initialize: async () => ({}),
		getDevicesForPlatform: () => data.connectedDevices || [],
	});
	injector.register("fs", {
		exists: (filePath: string) =>
			filePath.endsWith("build.xcconfig")
				? data.buildXcconfigContent !== undefined
				: data.hasProjectWorkspace,
		readText: () => data.buildXcconfigContent || "",
	});
	injector.register("logger", {
		getLevel: () => data.logLevel,
	});
	injector.register("options", { hostProjectPath: data.hostProjectPath });
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

function getXcodeProjectArgs(data?: { hasProjectWorkspace: boolean }) {
	const extraArgs = [
		"-scheme",
		projectName,
		"-skipPackagePluginValidation",
		"-skipMacroValidation",
	];
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
	describe("getXcodeProjectArgs", () => {
		const originalAuthProvider = process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER;

		afterEach(() => {
			if (originalAuthProvider === undefined) {
				delete process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER;
			} else {
				process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER = originalAuthProvider;
			}
		});

		it("should allow SWIFT_ENABLE_EXPLICIT_MODULES to be overridden from build.xcconfig", () => {
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
				buildXcconfigContent: "SWIFT_ENABLE_EXPLICIT_MODULES = YES",
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			assert.include(actualArgs, "SWIFT_ENABLE_EXPLICIT_MODULES=YES");
			assert.notInclude(actualArgs, "SWIFT_ENABLE_EXPLICIT_MODULES=NO");
		});

		it("leaves SWIFT_ENABLE_EXPLICIT_MODULES to Xcode when build.xcconfig doesn't set it", () => {
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			assert.isUndefined(
				actualArgs.find((arg) =>
					arg.startsWith("SWIFT_ENABLE_EXPLICIT_MODULES="),
				),
			);
		});

		it("should include DEVELOPMENT_TEAM from build.xcconfig", () => {
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
				buildXcconfigContent: "DEVELOPMENT_TEAM = TEAM123",
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			assert.include(actualArgs, "DEVELOPMENT_TEAM=TEAM123");
		});

		it("passes the package authorization provider from the environment", () => {
			process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER = "netrc";
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			const index = actualArgs.indexOf("-packageAuthorizationProvider");
			assert.notStrictEqual(index, -1);
			assert.strictEqual(actualArgs[index + 1], "netrc");
		});

		it("omits the package authorization provider when unset", () => {
			delete process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER;
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			assert.notInclude(actualArgs, "-packageAuthorizationProvider");
		});

		it("passes the DerivedData location only for host projects", () => {
			const argsFor = (hostProjectPath?: string) =>
				createTestInjector({
					logLevel: "INFO",
					hasProjectWorkspace: false,
					hostProjectPath,
				})
					.resolve("xcodebuildArgsService")
					.getXcodeProjectArgs(
						<any>{ projectRoot, normalizedPlatformName },
						<any>{ projectName, appResourcesDirectoryPath },
					);

			assert.notInclude(argsFor(), "-derivedDataPath");
			const hostArgs = argsFor("path/to/host");
			assert.strictEqual(
				hostArgs[hostArgs.indexOf("-derivedDataPath") + 1],
				path.join(projectRoot, "build", "DerivedData", projectName),
			);
		});

		it("keeps the project path as the second argument", () => {
			process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER = "keychain";
			const injector = createTestInjector({
				logLevel: "INFO",
				hasProjectWorkspace: false,
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = xcodebuildArgsService.getXcodeProjectArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
			);

			assert.strictEqual(actualArgs[0], "-project");
			assert.strictEqual(
				actualArgs[1],
				path.join(projectRoot, `${projectName}.xcodeproj`),
			);
		});
	});

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
							]
								.concat(getBuildLoggingArgs(logLevel))
								.concat(getXcodeProjectArgs({ hasProjectWorkspace }));

							assert.deepStrictEqual(actualArgs, expectedArgs);
						});
					});
				});
			});
		});
	});
	describe("getBuildForSimulatorArgs with a target simulator", () => {
		it("builds for that simulator only, like Xcode does", async () => {
			const injector = createTestInjector({
				logLevel: "TRACE",
				hasProjectWorkspace: false,
			});
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = await xcodebuildArgsService.getBuildForSimulatorArgs(
				<any>{ projectRoot, normalizedPlatformName },
				<any>{ projectName, appResourcesDirectoryPath },
				<any>{
					buildForDevice: false,
					platform: "iOS",
					_device: { deviceInfo: { identifier: "SIM-UDID" } },
				},
			);

			assert.deepStrictEqual(actualArgs.slice(0, 3), [
				"CODE_SIGN_IDENTITY=",
				"-destination",
				"platform=iOS Simulator,id=SIM-UDID",
			]);
			assert.notInclude(actualArgs, "ONLY_ACTIVE_ARCH=NO");
		});
	});

	describe("getBuildForDeviceArgs with a target device", () => {
		it("builds for that device, like Xcode's Run", async () => {
			let queriedDevices = false;
			const injector = createTestInjector({
				logLevel: "TRACE",
				hasProjectWorkspace: false,
			});
			injector.resolve("devicesService").initialize = async () => {
				queriedDevices = true;
			};
			const xcodebuildArgsService: IXcodebuildArgsService = injector.resolve(
				"xcodebuildArgsService",
			);

			const actualArgs = await xcodebuildArgsService.getBuildForDeviceArgs(
				<any>{
					projectRoot,
					normalizedPlatformName,
					getBuildOutputPath: () => buildOutputPath,
				},
				<any>{ projectName, appResourcesDirectoryPath },
				<any>{
					buildForDevice: true,
					platform: "ios",
					_device: { deviceInfo: { identifier: "DEVICE-UDID" } },
				},
			);

			assert.deepStrictEqual(actualArgs.slice(0, 3), [
				"-destination",
				"platform=iOS,id=DEVICE-UDID",
				"build",
			]);
			assert.notInclude(actualArgs, "ONLY_ACTIVE_ARCH=NO");
			assert.isFalse(queriedDevices);
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
				expectedArgs: ["ONLY_ACTIVE_ARCH=NO"],
			},
			{
				name: "should return correct args when there is only one connected device",
				connectedDevices: [{ deviceInfo: { activeArchitecture: "arm64" } }],
				expectedArgs: [],
			},
			{
				name: "should return correct args when no connected devices",
				connectedDevices: [],
				expectedArgs: [],
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
								...(configuration === "Release"
									? [
											"archive",
											"-archivePath",
											path.join(buildOutputPath, `${projectName}.xcarchive`),
										]
									: ["build"]),
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
