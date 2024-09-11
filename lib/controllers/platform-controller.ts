import { NativePlatformStatus, SupportedPlatform } from "../constants";
import * as path from "path";
import {
	IProjectDataService,
	IProjectData,
	INativePrepare,
} from "../definitions/project";
import {
	IPlatformController,
	IAddPlatformService,
	IPlatformsDataService,
	IAddPlatformData,
	IPlatformData,
} from "../definitions/platform";
import { IPackageInstallationManager } from "../declarations";
import { IFileSystem, IErrors } from "../common/declarations";
import { injector } from "../common/yok";

export class PlatformController implements IPlatformController {
	constructor(
		private $addPlatformService: IAddPlatformService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $projectDataService: IProjectDataService,
		private $platformsDataService: IPlatformsDataService,
		private $projectChangesService: IProjectChangesService,
		private $mobileHelper: Mobile.IMobileHelper
	) {}

	public async addPlatform(
		addPlatformData: IAddPlatformData,
		projectData?: IProjectData
	): Promise<void> {
		const [platform, version] = addPlatformData.platform
			.toLowerCase()
			.split("@");
		projectData ??= this.$projectDataService.getProjectData(
			addPlatformData.projectDir
		);
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		this.$logger.trace(
			`Creating NativeScript project for the ${platform} platform`
		);
		this.$logger.trace(`Path: ${platformData.projectRoot}`);
		this.$logger.trace(`Package: ${projectData.projectIdentifiers[platform]}`);
		this.$logger.trace(`Name: ${projectData.projectName}`);

		this.$logger.info("Copying template files...");

		const packageToInstall = await this.getPackageToInstall(
			platformData,
			projectData,
			addPlatformData.frameworkPath,
			version
		);

		this.$logger.trace("Determined package to install is", packageToInstall);

		const installedPlatformVersion =
			await this.$addPlatformService.addPlatformSafe(
				projectData,
				platformData,
				packageToInstall,
				addPlatformData
			);
		const buildPath = projectData.platformsDir;
		this.$fs.ensureDirectoryExists(path.join(buildPath, platform));

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			const gradlePropertiesPath = path.resolve(
				platformData.projectRoot,
				"gradle.properties"
			);
			const commentHeader = "# App configuration";
			const appPath = projectData.getAppDirectoryRelativePath();
			const appResourcesPath =
				projectData.getAppResourcesRelativeDirectoryPath();

			let gradlePropertiesContents = "";
			if (this.$fs.exists(gradlePropertiesPath)) {
				gradlePropertiesContents = this.$fs
					.readFile(gradlePropertiesPath)
					.toString();
			}

			if (!gradlePropertiesContents.includes(commentHeader)) {
				const dataToWrite = [
					"",
					"",
					commentHeader,
					`appPath = ${appPath}`,
					`appResourcesPath = ${appResourcesPath}`,
					`buildPath = ${buildPath}`,
					"",
				].join("\n");

				gradlePropertiesContents += dataToWrite;

				this.$logger.trace("Updated gradle.properties with project data...");
				this.$fs.writeFile(gradlePropertiesPath, gradlePropertiesContents);
			}
		}
		this.$logger.info(
			`Platform ${platform} successfully added. v${installedPlatformVersion}`
		);
	}

	public async addPlatformIfNeeded(
		addPlatformData: IAddPlatformData,
		projectData?: IProjectData
	): Promise<void> {
		if (addPlatformData.hostProjectPath) {
			this.$logger.trace(
				"Not adding platform because --hostProjectPath is provided."
			);
			return;
		}
		const [platform] = addPlatformData.platform.toLowerCase().split("@");

		projectData ??= this.$projectDataService.getProjectData(
			addPlatformData.projectDir
		);

		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		const shouldAddPlatform = this.shouldAddPlatform(
			platformData,
			projectData,
			addPlatformData.nativePrepare
		);
		if (shouldAddPlatform) {
			await this.addPlatform(addPlatformData, projectData);
		}
	}

	private async getPackageToInstall(
		platformData: IPlatformData,
		projectData: IProjectData,
		frameworkPath?: string,
		version?: string
	): Promise<string> {
		let result = null;
		if (frameworkPath) {
			if (!this.$fs.exists(frameworkPath)) {
				this.$errors.fail(
					`Invalid frameworkPath: ${frameworkPath}. Please ensure the specified frameworkPath exists.`
				);
			}
			result = "file:" + path.resolve(frameworkPath);
		} else {
			const desiredRuntimePackage = this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				platformData.platformNameLowerCase as SupportedPlatform
			);

			if (version) {
				desiredRuntimePackage.version = version;
			}

			if (!desiredRuntimePackage.version) {
				// if no version is explicitly added, then we use the latest
				desiredRuntimePackage.version =
					await this.$packageInstallationManager.getLatestCompatibleVersion(
						desiredRuntimePackage.name
					);
			}
			// const currentPlatformData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
			// version = (currentPlatformData && currentPlatformData.version) ||
			// 	await this.$packageInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
			result = `${desiredRuntimePackage.name}@${desiredRuntimePackage.version}`;
		}

		return result;
	}

	private shouldAddPlatform(
		platformData: IPlatformData,
		projectData: IProjectData,
		nativePrepare: INativePrepare
	): boolean {
		const platformName = platformData.platformNameLowerCase;
		const hasPlatformDirectory = this.$fs.exists(
			path.join(projectData.platformsDir, platformName)
		);

		const shouldAddNativePlatform =
			!nativePrepare || !nativePrepare.skipNativePrepare;
		const prepareInfo =
			this.$projectChangesService.getPrepareInfo(platformData);
		const requiresNativePlatformAdd =
			prepareInfo &&
			prepareInfo.nativePlatformStatus ===
				NativePlatformStatus.requiresPlatformAdd;
		const shouldAddPlatform =
			!hasPlatformDirectory ||
			(shouldAddNativePlatform && requiresNativePlatformAdd);

		if (hasPlatformDirectory && !shouldAddPlatform) {
			const platformDirectoryItemCount = this.$fs.readDirectory(
				path.join(projectData.platformsDir, platformName)
			).length;

			// 2 is a magic number to approximate a valid platform folder
			// any valid platform should contain at least 2 files/folders
			// we choose 2 to avoid false-positives due to system files like .DS_Store etc.
			if (platformDirectoryItemCount <= 2) {
				this.$logger.warn(
					`The platforms/${platformName} folder appears to be invalid. If the build fails, run 'ns clean' and rebuild the app.`,
					{ wrapMessageWithBorders: true }
				);
			}
		}

		return !!shouldAddPlatform;
	}
}
injector.register("platformController", PlatformController);
