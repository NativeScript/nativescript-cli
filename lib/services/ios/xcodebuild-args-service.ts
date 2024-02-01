import * as path from "path";
import * as constants from "../../constants";
import { Configurations } from "../../common/constants";
import {
	IIOSWatchAppService,
	IProjectData,
	IBuildConfig,
	IiOSBuildConfig,
} from "../../definitions/project";
import { IPlatformData } from "../../definitions/platform";
import { IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import * as _ from "lodash";

const DevicePlatformSdkName = "iphoneos";
const SimulatorPlatformSdkName = "iphonesimulator";

export class XcodebuildArgsService implements IXcodebuildArgsService {
	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $iOSWatchAppService: IIOSWatchAppService,
		private $logger: ILogger
	) {}

	public async getBuildForSimulatorArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig
	): Promise<string[]> {
		let args = await this.getArchitecturesArgs(buildConfig);

		if (this.$iOSWatchAppService.hasWatchApp(platformData, projectData)) {
			args = args.concat(["CODE_SIGNING_ALLOWED=NO"]);
		} else {
			args = args.concat(["CODE_SIGN_IDENTITY="]);
		}

		args = args
			.concat([
				"-destination",
				"generic/platform=iOS Simulator",
				"build",
				"-configuration",
				buildConfig.release ? Configurations.Release : Configurations.Debug,
			])
			.concat(
				this.getBuildCommonArgs(
					platformData,
					projectData,
					SimulatorPlatformSdkName
				)
			)
			.concat(this.getBuildLoggingArgs())
			.concat(this.getXcodeProjectArgs(platformData, projectData));

		return args;
	}

	public async getBuildForDeviceArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig
	): Promise<string[]> {
		const architectures = await this.getArchitecturesArgs(buildConfig);
		const archivePath = path.join(
			platformData.getBuildOutputPath(buildConfig),
			projectData.projectName + ".xcarchive"
		);
		const args = [
			"-destination",
			"generic/platform=iOS",
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
					DevicePlatformSdkName
				)
			)
			.concat(this.getBuildLoggingArgs());

		return args;
	}

	private async getArchitecturesArgs(
		buildConfig: IBuildConfig
	): Promise<string[]> {
		const args = [];

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
		projectData: IProjectData
	): string[] {
		const xcworkspacePath = path.join(
			platformData.projectRoot,
			`${projectData.projectName}.xcworkspace`
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
			constants.BUILD_XCCONFIG_FILE_NAME
		);

		if (this.$fs.exists(BUILD_SETTINGS_FILE_PATH)) {
			extraArgs.push("-xcconfig");
			extraArgs.push(BUILD_SETTINGS_FILE_PATH);
		}

		if (this.$fs.exists(xcworkspacePath)) {
			return ["-workspace", xcworkspacePath, ...extraArgs];
		}

		const xcodeprojPath = path.join(
			platformData.projectRoot,
			`${projectData.projectName}.xcodeproj`
		);
		return ["-project", xcodeprojPath, ...extraArgs];
	}

	private getBuildLoggingArgs(): string[] {
		return this.$logger.getLevel() === "INFO" ? ["-quiet"] : [];
	}

	private getBuildCommonArgs(
		platformData: IPlatformData,
		projectData: IProjectData,
		platformSdkName: string
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
		buildConfig: IiOSBuildConfig
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
