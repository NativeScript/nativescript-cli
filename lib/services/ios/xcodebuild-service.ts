import * as path from "path";

export class XcodebuildService implements IXcodebuildService {
	constructor(
		private $exportOptionsPlistService: IExportOptionsPlistService,
		private $xcodebuildArgsService: IXcodebuildArgsService,
		private $xcodebuildCommandService: IXcodebuildCommandService
	) { }

	public async buildForDevice(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		const args = await this.$xcodebuildArgsService.getBuildForDeviceArgs(platformData, projectData, buildConfig);
		await this.$xcodebuildCommandService.executeCommand(args, { cwd: platformData.projectRoot, stdio: buildConfig && buildConfig.buildOutputStdio });
		const archivePath = await this.createDevelopmentArchive(platformData, projectData, buildConfig);
		return archivePath;
	}

	public async buildForSimulator(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		const args = await this.$xcodebuildArgsService.getBuildForSimulatorArgs(platformData, projectData, buildConfig);
		const environment: IStringDictionary = {};
		environment["PRODUCT_BUNDLE_IDENTIFIER"] = projectData.projectIdentifiers.ios;
		const env = _.extend({}, process.env, environment);
		await this.$xcodebuildCommandService.executeCommand(args, { cwd: platformData.projectRoot, stdio: buildConfig.buildOutputStdio, env });
	}

	public async buildForAppStore(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		const args = await this.$xcodebuildArgsService.getBuildForDeviceArgs(platformData, projectData, buildConfig);
		await this.$xcodebuildCommandService.executeCommand(args, { cwd: platformData.projectRoot, stdio: buildConfig && buildConfig.buildOutputStdio });
		const archivePath = await this.createDistributionArchive(platformData, projectData, buildConfig);
		return archivePath;
	}

	private async createDevelopmentArchive(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		const archivePath = path.join(platformData.getBuildOutputPath(buildConfig), projectData.projectName + ".xcarchive");
		const output = this.$exportOptionsPlistService.createDevelopmentExportOptionsPlist(archivePath, projectData, buildConfig);
		const args = [
			"-exportArchive",
			"-archivePath", archivePath,
			"-exportPath", output.exportFileDir,
			"-exportOptionsPlist", output.exportOptionsPlistFilePath
		];
		await this.$xcodebuildCommandService.executeCommand(args, { cwd: platformData.projectRoot, stdio: buildConfig.buildOutputStdio });

		return output.exportFilePath;
	}

	private async createDistributionArchive(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		const archivePath = path.join(platformData.getBuildOutputPath(buildConfig), projectData.projectName + ".xcarchive");
		const output = this.$exportOptionsPlistService.createDistributionExportOptionsPlist(archivePath, projectData, buildConfig);
		const args = [
			"-exportArchive",
			"-archivePath", archivePath,
			"-exportPath", output.exportFileDir,
			"-exportOptionsPlist", output.exportOptionsPlistFilePath
		];

		await this.$xcodebuildCommandService.executeCommand(args, { cwd: platformData.projectRoot });

		return output.exportFilePath;
	}
}
$injector.register("xcodebuildService", XcodebuildService);
