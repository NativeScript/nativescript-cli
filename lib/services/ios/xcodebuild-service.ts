import * as path from "path";
import { IPlatformData } from "../../definitions/platform";
import { IProjectData, IBuildConfig } from "../../definitions/project";
import { injector } from "../../common/yok";
import { IFileSystem, IChildProcess } from "../../common/declarations";
import { getLegacyBuildOutputPath } from "./ios-build-paths";

export class XcodebuildService implements IXcodebuildService {
	constructor(
		private $childProcess: IChildProcess,
		private $exportOptionsPlistService: IExportOptionsPlistService,
		private $fs: IFileSystem,
		private $logger: ILogger,
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
		const ipaPath = this.$xcodebuildArgsService.shouldArchiveDeviceBuild(
			buildConfig,
		)
			? await this.createDevelopmentArchive(
					platformData,
					projectData,
					buildConfig,
				)
			: await this.packageDevelopmentIpa(
					platformData,
					projectData,
					buildConfig,
				);
		await this.copyToLegacyBuildOutputPath(platformData, buildConfig, ipaPath);
		return ipaPath;
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
		await this.copyToLegacyBuildOutputPath(
			platformData,
			buildConfig,
			path.join(
				platformData.getBuildOutputPath(buildConfig),
				`${projectData.projectName}.app`,
			),
		);
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
		const ipaPath = await this.createDistributionArchive(
			platformData,
			projectData,
			buildConfig,
		);
		await this.copyToLegacyBuildOutputPath(platformData, buildConfig, ipaPath);
		return ipaPath;
	}

	/**
	 * Mirrors the build artifact to the platforms/ios/build/<Config>-<sdk>
	 * folder that builds used before DerivedData moved, so CI scripts and
	 * Detox configs that point there keep working. cp -c clones on APFS, so
	 * this costs almost nothing. The artifact the CLI installs stays the one
	 * in DerivedData; a failed copy only warns.
	 */
	private async copyToLegacyBuildOutputPath(
		platformData: IPlatformData,
		buildConfig: IBuildConfig,
		artifactPath: string,
	): Promise<void> {
		const legacyOutputPath = getLegacyBuildOutputPath(
			platformData.projectRoot,
			platformData.getBuildOutputPath(buildConfig),
		);
		const legacyArtifactPath = path.join(
			legacyOutputPath,
			path.basename(artifactPath),
		);
		try {
			this.$fs.deleteDirectory(legacyArtifactPath);
			this.$fs.createDirectory(legacyOutputPath);
			await this.$childProcess.spawnFromEvent(
				"cp",
				["-cR", artifactPath, legacyOutputPath],
				"close",
				{},
				{ throwError: true },
			);
		} catch (err) {
			this.$logger.warn(
				`Unable to copy ${artifactPath} to ${legacyOutputPath}: ${err.message}`,
			);
		}
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
