import * as path from "path";
import * as constants from "../../constants";
import { Configurations } from "../../common/constants";

const DevicePlatformSdkName = "iphoneos";
const SimulatorPlatformSdkName = "iphonesimulator";

export class XcodebuildArgsService implements IXcodebuildArgsService {

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $fs: IFileSystem,
		private $logger: ILogger
	) { }

	public async getBuildForSimulatorArgs(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string[]> {
		let args = await this.getArchitecturesArgs(buildConfig);

		args = args
			.concat([
				"build",
				"-configuration", buildConfig.release ? Configurations.Release : Configurations.Debug,
				"CODE_SIGN_IDENTITY="
			])
			.concat(this.getBuildCommonArgs(platformData.projectRoot, SimulatorPlatformSdkName))
			.concat(this.getBuildLoggingArgs())
			.concat(this.getXcodeProjectArgs(platformData.projectRoot, projectData));

		return args;
	}

	public async getBuildForDeviceArgs(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string[]> {
		const architectures = await this.getArchitecturesArgs(buildConfig);
		const archivePath = path.join(platformData.getBuildOutputPath(buildConfig), projectData.projectName + ".xcarchive");
		const args = [
			"archive",
			"-archivePath", archivePath,
			"-configuration", buildConfig.release ? Configurations.Release : Configurations.Debug
		]
			.concat(this.getXcodeProjectArgs(platformData.projectRoot, projectData, "scheme"))
			.concat(architectures)
			.concat(this.getBuildCommonArgs(platformData.projectRoot, DevicePlatformSdkName))
			.concat(this.getBuildLoggingArgs());

		return args;
	}

	private async getArchitecturesArgs(buildConfig: IBuildConfig): Promise<string[]> {
		const args = [];

		const devicesArchitectures = buildConfig.buildForDevice ? await this.getArchitecturesFromConnectedDevices(buildConfig) : [];
		if (!buildConfig.buildForDevice || devicesArchitectures.length > 1) {
			args.push("ONLY_ACTIVE_ARCH=NO");
		}

		return args;
	}

	private getXcodeProjectArgs(projectRoot: string, projectData: IProjectData, product?: "scheme" | "target"): string[] {
		const xcworkspacePath = path.join(projectRoot, `${projectData.projectName}.xcworkspace`);
		if (this.$fs.exists(xcworkspacePath)) {
			return [ "-workspace", xcworkspacePath, "-scheme", projectData.projectName ];
		}

		const xcodeprojPath = path.join(projectRoot, `${projectData.projectName}.xcodeproj`);
		return [ "-project", xcodeprojPath, product ? "-" + product : "-target", projectData.projectName ];
	}

	private getBuildLoggingArgs(): string[] {
		return this.$logger.getLevel() === "INFO" ? ["-quiet"] : [];
	}

	private getBuildCommonArgs(projectRoot: string, platformSdkName: string): string[] {
		const args = [
			"-sdk", platformSdkName,
			"BUILD_DIR=" + path.join(projectRoot, constants.BUILD_DIR),
			'SHARED_PRECOMPS_DIR=' + path.join(projectRoot, 'build', 'sharedpch'),
			'-allowProvisioningUpdates'
		];

		return args;
	}

	private async getArchitecturesFromConnectedDevices(buildConfig: IiOSBuildConfig): Promise<string[]> {
		const platform = this.$devicePlatformsConstants.iOS.toLowerCase();
		await this.$devicesService.initialize({
			platform,
			deviceId: buildConfig.device,
			skipEmulatorStart: true
		});
		const instances = this.$devicesService.getDevicesForPlatform(platform);
		const architectures = _(instances)
			.map(d => d.deviceInfo.activeArchitecture)
			.filter(d => !!d)
			.uniq()
			.value();

		return architectures;
	}
}
$injector.register("xcodebuildArgsService", XcodebuildArgsService);
