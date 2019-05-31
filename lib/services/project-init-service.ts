import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as path from "path";
import * as semver from "semver";

export class ProjectInitService implements IProjectInitService {
	private static MIN_SUPPORTED_FRAMEWORK_VERSIONS: IStringDictionary = {
		"tns-ios": "1.1.0",
		"tns-android": "1.1.0",
		"tns-core-modules": "1.2.0"
	};

	private static VERSION_KEY_NAME = "version";

	private _projectFilePath: string;

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions,
		private $injector: IInjector,
		private $staticConfig: IStaticConfig,
		private $projectHelper: IProjectHelper,
		private $prompter: IPrompter,
		private $packageManager: INodePackageManager,
		private $packageInstallationManager: IPackageInstallationManager) { }

	public async initialize(): Promise<void> {
		let projectData: any = {};

		if (this.$fs.exists(this.projectFilePath)) {
			projectData = this.$fs.readJson(this.projectFilePath);
		}

		const projectDataBackup = _.extend({}, projectData);

		if (!projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]) {
			projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = {};
			this.$fs.writeJson(this.projectFilePath, projectData); // We need to create package.json file here in order to prevent "No project found at or above and neither was a --path specified." when resolving platformsData
		}

		try {
			projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]["id"] = await this.getProjectId();

			if (this.$options.frameworkName && this.$options.frameworkVersion) {
				const currentPlatformData = projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][this.$options.frameworkName] || {};

				projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][this.$options.frameworkName] = _.extend(currentPlatformData, this.buildVersionData(this.$options.frameworkVersion));
			} else {
				const $platformsData = this.$injector.resolve("platformsData");
				const $projectData = this.$injector.resolve("projectData");
				$projectData.initializeProjectData(path.dirname(this.projectFilePath));
				for (const platform of $platformsData.platformsNames) {
					const platformData: IPlatformData = $platformsData.getPlatformData(platform, $projectData);
					if (!platformData.targetedOS || (platformData.targetedOS && _.includes(platformData.targetedOS, process.platform))) {
						const currentPlatformData = projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][platformData.frameworkPackageName] || {};

						projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][platformData.frameworkPackageName] = _.extend(currentPlatformData, await this.getVersionData(platformData.frameworkPackageName));
					}
				}
			}

			const dependencies = projectData.dependencies;
			if (!dependencies) {
				projectData.dependencies = Object.create(null);
			}

			// In case console is interactive and --force is not specified, do not read the version from package.json, show all available versions to the user.
			const tnsCoreModulesVersionInPackageJson = this.useDefaultValue ? projectData.dependencies[constants.TNS_CORE_MODULES_NAME] : null;
			projectData.dependencies[constants.TNS_CORE_MODULES_NAME] = tnsCoreModulesVersionInPackageJson || (await this.getVersionData(constants.TNS_CORE_MODULES_NAME))["version"];

			this.$fs.writeJson(this.projectFilePath, projectData);
		} catch (err) {
			this.$fs.writeJson(this.projectFilePath, projectDataBackup);
			throw err;
		}

		this.$logger.info("Project successfully initialized.");
	}

	private get projectFilePath(): string {
		if (!this._projectFilePath) {
			const projectDir = path.resolve(this.$options.path || ".");
			this._projectFilePath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
		}

		return this._projectFilePath;
	}

	private async getProjectId(): Promise<string> {
		if (this.$options.appid) {
			return this.$options.appid;
		}

		const defaultAppId = this.$projectHelper.generateDefaultAppId(path.basename(path.dirname(this.projectFilePath)), constants.DEFAULT_APP_IDENTIFIER_PREFIX);
		if (this.useDefaultValue) {
			return defaultAppId;
		}

		return await this.$prompter.getString("Id:", { defaultAction: () => defaultAppId });
	}

	private async getVersionData(packageName: string): Promise<IStringDictionary> {
		const latestVersion = await this.$packageInstallationManager.getLatestCompatibleVersion(packageName);

		if (this.useDefaultValue) {
			return this.buildVersionData(latestVersion);
		}

		const allVersions: any = await this.$packageManager.view(packageName, { "versions": true });
		const versions = _.filter(allVersions, (v: string) => semver.gte(v, ProjectInitService.MIN_SUPPORTED_FRAMEWORK_VERSIONS[packageName]));
		if (versions.length === 1) {
			this.$logger.info(`Only ${versions[0]} version is available for ${packageName}.`);
			return this.buildVersionData(versions[0]);
		}
		const sortedVersions = versions.sort(helpers.versionCompare).reverse();
		//TODO: plamen5kov: don't offer versions from next (they are not available)
		const version = await this.$prompter.promptForChoice(`${packageName} version:`, sortedVersions);
		return this.buildVersionData(version);
	}

	private buildVersionData(version: string): IStringDictionary {
		const result: IStringDictionary = {};

		result[ProjectInitService.VERSION_KEY_NAME] = version;

		return result;
	}

	private get useDefaultValue(): boolean {
		return !helpers.isInteractive() || this.$options.force;
	}
}
$injector.register("projectInitService", ProjectInitService);
