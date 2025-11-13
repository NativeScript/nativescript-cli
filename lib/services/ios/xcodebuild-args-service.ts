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

import {
	DevicePlatformSdkName,
	SimulatorPlatformSdkName,
	VisionDevicePlatformSdkName,
	VisionSimulatorPlatformSdkName,
} from "../ios-project-service";

export class XcodebuildArgsService implements IXcodebuildArgsService {
	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $iOSWatchAppService: IIOSWatchAppService,
		private $logger: ILogger,
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

		const extraArgs: string[] = [
			"-scheme",
			projectData.projectName,
			skipPackageValidation,
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
