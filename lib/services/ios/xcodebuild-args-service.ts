import * as path from "path";
import * as constants from "../../constants";
import { Configurations } from "../../common/constants";
import {
	IIOSWatchAppService,
	IProjectData,
	IBuildConfig,
	IiOSBuildConfig,
} from "../../definitions/project";
import { IXcconfigService } from "../../declarations";
import { IPlatformData } from "../../definitions/platform";
import { IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import * as _ from "lodash";
import * as semver from "semver";

import {
	DevicePlatformSdkName,
	SimulatorPlatformSdkName,
	VisionDevicePlatformSdkName,
	VisionSimulatorPlatformSdkName,
} from "../ios-project-service";

export class XcodebuildArgsService implements IXcodebuildArgsService {
	private static readonly MIN_CATALYST_DEPLOYMENT_TARGET = "13.1";

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $iOSWatchAppService: IIOSWatchAppService,
		private $logger: ILogger,
		private $xcconfigService: IXcconfigService,
	) {}

	public getBuildForCatalystArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): string[] {
		// Mac Catalyst is a variant of the iOS platform rather than a platform of
		// its own: the same target is rebuilt against the macOS SDK with the
		// `-macabi` triple. `SUPPORTS_MACCATALYST` has to be forced because the
		// runtime template only enables the legacy `SUPPORTS_UIKITFORMAC` alias.
		return [
			"-destination",
			"platform=macOS,variant=Mac Catalyst",
			"build",
			"-configuration",
			buildConfig.release ? Configurations.Release : Configurations.Debug,
			"-allowProvisioningUpdates",
			"SUPPORTS_MACCATALYST=YES",
			// no `-sdk` here: the destination already selects macOS + the Mac Catalyst
			// variant, and forcing an SDK on top of it makes xcodebuild pick iphoneos
			"BUILD_DIR=" + path.join(platformData.projectRoot, constants.BUILD_DIR),
			"SHARED_PRECOMPS_DIR=" +
				path.join(platformData.projectRoot, constants.BUILD_DIR, "sharedpch"),
		]
			.concat(
				// the deployment target is re-added below, clamped to what Catalyst supports
				this
					.getXcodeProjectArgs(platformData, projectData)
					.filter((arg) => !arg.startsWith("IPHONEOS_DEPLOYMENT_TARGET=")),
			)
			.concat(this.getCatalystDeploymentTargetArgs(projectData))
			.concat(this.getBuildLoggingArgs());
	}

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

		let destination = "generic/platform=iOS Simulator";

		let isvisionOS = this.$devicePlatformsConstants.isvisionOS(
			buildConfig.platform,
		);

		if (isvisionOS) {
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
			.concat(
				this.getBuildCommonArgs(
					platformData,
					projectData,
					isvisionOS
						? VisionSimulatorPlatformSdkName
						: SimulatorPlatformSdkName,
				),
			)
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
		let destination = "generic/platform=iOS";
		let isvisionOS = this.$devicePlatformsConstants.isvisionOS(
			buildConfig.platform,
		);

		if (isvisionOS) {
			destination = "generic/platform=visionOS";
			if (buildConfig._device) {
				destination += `,id=${buildConfig._device.deviceInfo.identifier}`;
			}
		}
		const args = [
			"-destination",
			destination,
			"archive",
			"-archivePath",
			archivePath,
			"-configuration",
			buildConfig.release ? Configurations.Release : Configurations.Debug,
			"-allowProvisioningUpdates",
		]
			.concat(this.getXcodeProjectArgs(platformData, projectData))
			.concat(architectures)
			.concat(
				this.getBuildCommonArgs(
					platformData,
					projectData,
					isvisionOS ? VisionDevicePlatformSdkName : DevicePlatformSdkName,
				),
			)
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

	private async getArchitecturesArgs(
		buildConfig: IBuildConfig,
	): Promise<string[]> {
		const args = [];

		if (this.$devicePlatformsConstants.isvisionOS(buildConfig.platform)) {
			// visionOS builds (device/simulator) are arm64-only; rely on destination for arch
			// and explicitly exclude x86_64 to avoid accidental selection
			args.push("ONLY_ACTIVE_ARCH=YES", "EXCLUDED_ARCHS=x86_64");
			return args;
		}

		const devicesArchitectures = buildConfig.buildForDevice
			? await this.getArchitecturesFromConnectedDevices(buildConfig)
			: [];
		if (!buildConfig.buildForDevice || devicesArchitectures.length > 1) {
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

		// Xcode 26 makes Swift "explicitly built modules" the default. A
		// regression there prevents macro/compiler-plugin SPM targets from
		// resolving their swift-syntax module dependencies, failing with:
		// "Unable to resolve module dependency: 'SwiftSyntax'" (and SwiftParser,
		// SwiftSyntaxMacros, SwiftCompilerPlugin, SwiftDiagnostics).
		// Passed as a command-line build setting so it overrides ALL targets,
		// including the package targets we don't control.
		// ref: https://forums.swift.org/t/xcode-26-unable-to-find-module-dependency/80516
		const explicitModulesProperty = "SWIFT_ENABLE_EXPLICIT_MODULES";
		const explicitModulesValue =
			this.$xcconfigService.readPropertyValue(
				BUILD_SETTINGS_FILE_PATH,
				explicitModulesProperty,
			) || "NO";
		extraArgs.push(`${explicitModulesProperty}=${explicitModulesValue}`);

		const deployTargetProperty = "IPHONEOS_DEPLOYMENT_TARGET";
		const deployTargetVersion = this.$xcconfigService.readPropertyValue(
			BUILD_SETTINGS_FILE_PATH,
			deployTargetProperty,
		);
		if (deployTargetVersion) {
			extraArgs.push(`${deployTargetProperty}=${deployTargetVersion}`);
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

	/**
	 * Mac Catalyst starts at iOS 13.1, so a project that still targets an older iOS
	 * cannot be built as-is. Raise the deployment target for the Catalyst build only
	 * rather than failing — the iOS build keeps whatever the app has chosen.
	 * `MACCATALYST_DEPLOYMENT_TARGET` is passed alongside because the runtime's
	 * metadata generator reads it and older runtimes crash when it is unset.
	 */
	private getCatalystDeploymentTargetArgs(projectData: IProjectData): string[] {
		const buildSettingsFilePath = path.join(
			projectData.appResourcesDirectoryPath,
			this.$devicePlatformsConstants.iOS,
			constants.BUILD_XCCONFIG_FILE_NAME,
		);
		const projectDeploymentTarget = this.$xcconfigService.readPropertyValue(
			buildSettingsFilePath,
			"IPHONEOS_DEPLOYMENT_TARGET",
		);
		const minimum = XcodebuildArgsService.MIN_CATALYST_DEPLOYMENT_TARGET;
		let deploymentTarget = projectDeploymentTarget;

		if (
			!deploymentTarget ||
			semver.lt(semver.coerce(deploymentTarget), semver.coerce(minimum))
		) {
			if (deploymentTarget) {
				this.$logger.warn(
					`Mac Catalyst requires iOS ${minimum} or higher. Building the Mac Catalyst app with IPHONEOS_DEPLOYMENT_TARGET=${minimum} instead of the project's ${deploymentTarget}.`,
				);
			}
			deploymentTarget = minimum;
		}

		return [
			`IPHONEOS_DEPLOYMENT_TARGET=${deploymentTarget}`,
			`MACCATALYST_DEPLOYMENT_TARGET=${deploymentTarget}`,
		];
	}

	private getBuildCommonArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		platformSdkName: string,
	): string[] {
		let args: string[] = [];

		if (!this.$iOSWatchAppService.hasWatchApp(platformData, projectData)) {
			args = args.concat(["-sdk", platformSdkName]);
		}

		args = args.concat([
			"BUILD_DIR=" + path.join(platformData.projectRoot, constants.BUILD_DIR),
			"SHARED_PRECOMPS_DIR=" +
				path.join(platformData.projectRoot, constants.BUILD_DIR, "sharedpch"),
		]);

		return args;
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
