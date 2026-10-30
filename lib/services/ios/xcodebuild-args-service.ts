import * as path from "path";
import * as constants from "../../constants";
import { Configurations } from "../../common/constants";
import {
	IIOSWatchAppService,
	IProjectData,
	IBuildConfig,
	IiOSBuildConfig,
} from "../../definitions/project";
import { IOptions, IXcconfigService } from "../../declarations";
import { IPlatformData } from "../../definitions/platform";
import { IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import * as _ from "lodash";

import { getDerivedDataPath } from "../ios-project-service";

export class XcodebuildArgsService implements IXcodebuildArgsService {
	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $iOSWatchAppService: IIOSWatchAppService,
		private $logger: ILogger,
		private $options: IOptions,
		private $xcconfigService: IXcconfigService,
	) {}

	public async getBuildForSimulatorArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string[]> {
		let args = await this.getArchitecturesArgs(buildConfig);

		if (this.$iOSWatchAppService.hasWatchApp(platformData, projectData)) {
			args = args.concat(["CODE_SIGNING_ALLOWED=NO"]);
		} else {
			args = args.concat(["CODE_SIGN_IDENTITY="]);
		}

		let destination = buildConfig._device
			? `platform=iOS Simulator,id=${buildConfig._device.deviceInfo.identifier}`
			: "generic/platform=iOS Simulator";

		if (this.$devicePlatformsConstants.isvisionOS(buildConfig.platform)) {
			destination = "generic/platform=visionOS Simulator";
			if (buildConfig._device) {
				destination += `,id=${buildConfig._device.deviceInfo.identifier}`;
			}
		}

		args = args
			.concat([
				"-destination",
				destination,
				"build",
				"-configuration",
				buildConfig.release ? Configurations.Release : Configurations.Debug,
			])
			.concat(this.getBuildLoggingArgs())
			.concat(this.getXcodeProjectArgs(platformData, projectData));

		return args;
	}

	public async getBuildForDeviceArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string[]> {
		const architectures = await this.getArchitecturesArgs(buildConfig);
		const archivePath = path.join(
			platformData.getBuildOutputPath(buildConfig),
			projectData.projectName + ".xcarchive",
		);
		let isvisionOS = this.$devicePlatformsConstants.isvisionOS(
			buildConfig.platform,
		);
		const shouldArchive = this.shouldArchiveDeviceBuild(buildConfig);
		let destination =
			!shouldArchive && buildConfig._device
				? `platform=iOS,id=${buildConfig._device.deviceInfo.identifier}`
				: "generic/platform=iOS";

		if (isvisionOS) {
			destination = "generic/platform=visionOS";
			if (buildConfig._device) {
				destination += `,id=${buildConfig._device.deviceInfo.identifier}`;
			}
		}
		const args = [
			"-destination",
			destination,
			...(shouldArchive ? ["archive", "-archivePath", archivePath] : ["build"]),
			"-configuration",
			buildConfig.release ? Configurations.Release : Configurations.Debug,
			"-allowProvisioningUpdates",
		]
			.concat(this.getXcodeProjectArgs(platformData, projectData))
			.concat(architectures)
			.concat(this.getBuildLoggingArgs());

		// pbxproj-dom sets CODE_SIGN_IDENTITY[sdk=iphoneos*] which doesn't match
		// the xros SDK used by visionOS builds — pass it explicitly as an override
		if (isvisionOS) {
			args.push(
				`CODE_SIGN_IDENTITY=${
					buildConfig.release ? "Apple Distribution" : "Apple Development"
				}`,
			);
		}

		return args;
	}

	/**
	 * Debug device builds use a plain build, like Xcode's Run, so both share
	 * one set of intermediates; archives are only needed for release.
	 */
	public shouldArchiveDeviceBuild(
		buildConfig: IBuildConfig & { buildForAppStore?: boolean },
	): boolean {
		return !!(buildConfig.release || buildConfig.buildForAppStore);
	}

	private async getArchitecturesArgs(
		buildConfig: IBuildConfig,
	): Promise<string[]> {
		const args: string[] = [];

		if (this.$devicePlatformsConstants.isvisionOS(buildConfig.platform)) {
			// visionOS builds (device/simulator) are arm64-only; rely on destination for arch
			// and explicitly exclude x86_64 to avoid accidental selection
			args.push("ONLY_ACTIVE_ARCH=YES", "EXCLUDED_ARCHS=x86_64");
			return args;
		}

		if (!buildConfig.buildForDevice) {
			// A specific simulator destination already limits the build to its
			// architecture, the same way Xcode builds for it.
			if (!buildConfig._device) {
				args.push("ONLY_ACTIVE_ARCH=NO");
			}
			return args;
		}

		if (buildConfig._device && !this.shouldArchiveDeviceBuild(buildConfig)) {
			return args;
		}

		const devicesArchitectures =
			await this.getArchitecturesFromConnectedDevices(buildConfig);
		if (devicesArchitectures.length > 1) {
			args.push("ONLY_ACTIVE_ARCH=NO");
		}

		return args;
	}

	public getXcodeProjectArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
	): string[] {
		const xcworkspacePath = path.join(
			platformData.projectRoot,
			`${projectData.projectName}.xcworkspace`,
		);
		// Introduced in Xcode 14+
		// ref: https://forums.swift.org/t/telling-xcode-14-beta-4-to-trust-build-tool-plugins-programatically/59305/5
		const skipPackageValidation = "-skipPackagePluginValidation";
		// Introduced in Xcode 15+ to trust Swift macros (compiler plugins)
		// non-interactively. Required for SPM packages that ship macros
		// (e.g. apple/RealityKitScripting), otherwise the build fails with:
		// "Macro '...' from package '...' must be enabled before it can be used"
		// ref: https://developer.apple.com/documentation/xcode/writing-swift-macros
		const skipMacroValidation = "-skipMacroValidation";
		const extraArgs: string[] = [
			"-scheme",
			projectData.projectName,
			skipPackageValidation,
			skipMacroValidation,
		];

		// Otherwise the workspace's DerivedData setting decides the location.
		// Passing -derivedDataPath as well would move the module and SDK stat
		// caches, whose paths end up in every compile command, so CLI and Xcode
		// builds would no longer reuse each other's output.
		if (this.$options.hostProjectPath) {
			extraArgs.push(
				"-derivedDataPath",
				getDerivedDataPath(platformData.projectRoot, projectData.projectName),
			);
		}

		// Selects how xcodebuild authenticates against private Swift Package
		// registries ("netrc" or "keychain"). It describes the machine's
		// credential setup rather than the build, so it is read from the
		// environment instead of a command-line option.
		const packageAuthorizationProvider =
			process.env.NS_PACKAGE_AUTHORIZATION_PROVIDER;
		if (packageAuthorizationProvider) {
			extraArgs.push(
				"-packageAuthorizationProvider",
				packageAuthorizationProvider,
			);
		}

		const BUILD_SETTINGS_FILE_PATH = path.join(
			projectData.appResourcesDirectoryPath,
			platformData.normalizedPlatformName,
			constants.BUILD_XCCONFIG_FILE_NAME,
		);

		// Only include explicit properties from build.xcconfig
		// Note: we could include entire file via -xcconfig flag
		// however doing so introduces unwanted side effects
		// like cocoapods issues related to ASSETCATALOG_COMPILER_APPICON_NAME
		// references: https://medium.com/@iostechset/why-cocoapods-eats-app-icons-79fe729808d4
		// https://github.com/CocoaPods/CocoaPods/issues/7003

		// Passed as a command-line build setting so it also reaches package
		// targets, but only when the app sets it: any value Xcode wouldn't use
		// itself stops CLI and Xcode builds from reusing each other's output.
		// Early Xcode 26 releases fail on macro packages with explicit modules
		// ("Unable to resolve module dependency: 'SwiftSyntax'"); setting it to
		// NO in build.xcconfig works around that.
		// ref: https://forums.swift.org/t/xcode-26-unable-to-find-module-dependency/80516
		const explicitModulesProperty = "SWIFT_ENABLE_EXPLICIT_MODULES";
		const explicitModulesValue = this.$xcconfigService.readPropertyValue(
			BUILD_SETTINGS_FILE_PATH,
			explicitModulesProperty,
		);
		if (explicitModulesValue) {
			extraArgs.push(`${explicitModulesProperty}=${explicitModulesValue}`);
		}

		const swiftUIBootProperty = "NS_SWIFTUI_BOOT";
		const swiftUIBootValue = this.$xcconfigService.readPropertyValue(
			BUILD_SETTINGS_FILE_PATH,
			swiftUIBootProperty,
		);
		if (swiftUIBootValue) {
			extraArgs.push(`${swiftUIBootProperty}=${swiftUIBootValue}`);
		}

		// Swift macro/compiler-plugin SPM targets must be code-signed with a
		// development team when building for a device. Pass DEVELOPMENT_TEAM as a
		// command-line build setting so it applies to SPM package targets too.
		const developmentTeamProperty = "DEVELOPMENT_TEAM";
		const developmentTeamValue = this.$xcconfigService.readPropertyValue(
			BUILD_SETTINGS_FILE_PATH,
			developmentTeamProperty,
		);
		if (developmentTeamValue) {
			extraArgs.push(`${developmentTeamProperty}=${developmentTeamValue}`);
		}

		if (this.$fs.exists(xcworkspacePath)) {
			return ["-workspace", xcworkspacePath, ...extraArgs];
		}

		const xcodeprojPath = path.join(
			platformData.projectRoot,
			`${projectData.projectName}.xcodeproj`,
		);
		return ["-project", xcodeprojPath, ...extraArgs];
	}

	private getBuildLoggingArgs(): string[] {
		return this.$logger.getLevel() === "INFO" ? ["-quiet"] : [];
	}

	private async getArchitecturesFromConnectedDevices(
		buildConfig: IiOSBuildConfig,
	): Promise<string[]> {
		const platform = this.$devicePlatformsConstants.iOS.toLowerCase();
		await this.$devicesService.initialize({
			platform,
			deviceId: buildConfig.device,
			skipEmulatorStart: true,
		});
		const instances = this.$devicesService.getDevicesForPlatform(platform);
		const architectures = _(instances)
			.map((d) => d.deviceInfo.activeArchitecture)
			.filter((d) => !!d)
			.uniq()
			.value();

		return architectures;
	}
}
injector.register("xcodebuildArgsService", XcodebuildArgsService);
