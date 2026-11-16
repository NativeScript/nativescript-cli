import * as path from "path";
import { IPlatformData } from "../../definitions/platform";
import { IProjectData, IBuildConfig } from "../../definitions/project";
import { injector } from "../../common/yok";
import { IFileSystem, IChildProcess } from "../../common/declarations";

export class XcodebuildService implements IXcodebuildService {
	constructor(
		private $childProcess: IChildProcess,
		private $exportOptionsPlistService: IExportOptionsPlistService,
		private $fs: IFileSystem,
		private $xcodebuildArgsService: IXcodebuildArgsService,
		private $xcodebuildCommandService: IXcodebuildCommandService,
	) {}

	public async buildForDevice(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string> {
		const args = await this.$xcodebuildArgsService.getBuildForDeviceArgs(
			platformData,
			projectData,
			buildConfig,
		);
		await this.$xcodebuildCommandService.executeCommand(args, {
			cwd: platformData.projectRoot,
			stdio: buildConfig && buildConfig.buildOutputStdio,
		});
		if (!this.$xcodebuildArgsService.shouldArchiveDeviceBuild(buildConfig)) {
			return this.packageDevelopmentIpa(platformData, projectData, buildConfig);
		}
		const archivePath = await this.createDevelopmentArchive(
			platformData,
			projectData,
			buildConfig,
		);
		return archivePath;
	}

	public async buildForSimulator(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<void> {
		const args = await this.$xcodebuildArgsService.getBuildForSimulatorArgs(
			platformData,
			projectData,
			buildConfig,
		);
		await this.$xcodebuildCommandService.executeCommand(args, {
			cwd: platformData.projectRoot,
			stdio: buildConfig.buildOutputStdio,
		});
	}

	public async buildForAppStore(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string> {
		const args = await this.$xcodebuildArgsService.getBuildForDeviceArgs(
			platformData,
			projectData,
			buildConfig,
		);
		await this.$xcodebuildCommandService.executeCommand(args, {
			cwd: platformData.projectRoot,
			stdio: buildConfig && buildConfig.buildOutputStdio,
		});
		const archivePath = await this.createDistributionArchive(
			platformData,
			projectData,
			buildConfig,
		);
		return archivePath;
	}

	/**
	 * Packages the signed .app from a plain build as an .ipa, at the same path
	 * an exported development archive would use.
	 */
	private async packageDevelopmentIpa(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string> {
		const outputPath = platformData.getBuildOutputPath(buildConfig);
		const appPath = path.join(outputPath, `${projectData.projectName}.app`);
		const ipaPath = path.join(outputPath, `${projectData.projectName}.ipa`);
		// Kept next to the .app so cp -c can clone it instead of copying.
		const payloadPath = path.join(outputPath, "ipa-staging", "Payload");

		this.$fs.deleteDirectory(path.dirname(payloadPath));
		this.$fs.deleteFile(ipaPath);
		this.$fs.createDirectory(payloadPath);
		try {
			await this.$childProcess.spawnFromEvent(
				"cp",
				["-cR", appPath, payloadPath],
				"close",
				{},
				{ throwError: true },
			);
			await this.$childProcess.spawnFromEvent(
				"ditto",
				[
					"-c",
					"-k",
					"--norsrc",
					"--zlibCompressionLevel",
					"0",
					"--keepParent",
					payloadPath,
					ipaPath,
				],
				"close",
				{},
				{ throwError: true },
			);
		} finally {
			this.$fs.deleteDirectory(path.dirname(payloadPath));
		}

		return ipaPath;
	}

	private async createDevelopmentArchive(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string> {
		const archivePath = path.join(
			platformData.getBuildOutputPath(buildConfig),
			projectData.projectName + ".xcarchive",
		);
		const output =
			await this.$exportOptionsPlistService.createDevelopmentExportOptionsPlist(
				archivePath,
				projectData,
				buildConfig,
			);
		const args = [
			"-exportArchive",
			"-archivePath",
			archivePath,
			"-exportPath",
			output.exportFileDir,
			"-exportOptionsPlist",
			output.exportOptionsPlistFilePath,
		];
		await this.$xcodebuildCommandService.executeCommand(args, {
			cwd: platformData.projectRoot,
			stdio: buildConfig.buildOutputStdio,
		});

		return output.exportFilePath;
	}

	private async createDistributionArchive(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildConfig: IBuildConfig,
	): Promise<string> {
		const archivePath = path.join(
			platformData.getBuildOutputPath(buildConfig),
			projectData.projectName + ".xcarchive",
		);
		const output =
			await this.$exportOptionsPlistService.createDistributionExportOptionsPlist(
				archivePath,
				projectData,
				buildConfig,
			);
		const provision =
			buildConfig.provision || buildConfig.mobileProvisionIdentifier;
		const args = [
			"-exportArchive",
			"-archivePath",
			archivePath,
			"-exportPath",
			output.exportFileDir,
			"-exportOptionsPlist",
			output.exportOptionsPlistFilePath,
			provision ? "" : "-allowProvisioningUpdates", // no profiles specificed so let xcode decide.
		];

		await this.$xcodebuildCommandService.executeCommand(args, {
			cwd: platformData.projectRoot,
		});

		return output.exportFilePath;
	}
}
injector.register("xcodebuildService", XcodebuildService);
