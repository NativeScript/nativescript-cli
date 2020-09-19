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
enum ProductArgs {
	target = "target",
	scheme = "scheme",
}

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

		let productType: ProductArgs;
		if (this.$iOSWatchAppService.hasWatchApp(platformData, projectData)) {
			productType = ProductArgs.scheme;
			args = args.concat([
				"-destination",
				"generic/platform=iOS Simulator",
				"CODE_SIGNING_ALLOWED=NO",
			]);
		} else {
			args = args.concat(["CODE_SIGN_IDENTITY="]);
		}

		args = args
			.concat([
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
			.concat(
				this.getXcodeProjectArgs(
					platformData.projectRoot,
					projectData,
					productType
				)
			);

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
			"archive",
			"-archivePath",
			archivePath,
			"-configuration",
			buildConfig.release ? Configurations.Release : Configurations.Debug,
			"-allowProvisioningUpdates",
		]
			.concat(
				this.getXcodeProjectArgs(
					platformData.projectRoot,
					projectData,
					ProductArgs.scheme
				)
			)
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

		if (!devicesArchitectures.includes("arm64")) {
			// don't build form arm64 if we have no arm64 targets
			// todo: re-visit if arm64 simulators start failing
			args.push("EXCLUDED_ARCHS=arm64");
		}

		return args;
	}

	private getXcodeProjectArgs(
		projectRoot: string,
		projectData: IProjectData,
		product?: ProductArgs
	): string[] {
		const xcworkspacePath = path.join(
			projectRoot,
			`${projectData.projectName}.xcworkspace`
		);
		if (this.$fs.exists(xcworkspacePath)) {
			return [
				"-workspace",
				xcworkspacePath,
				"-scheme",
				projectData.projectName,
			];
		}

		const xcodeprojPath = path.join(
			projectRoot,
			`${projectData.projectName}.xcodeproj`
		);
		return [
			"-project",
			xcodeprojPath,
			product ? "-" + product : "-target",
			projectData.projectName,
		];
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
