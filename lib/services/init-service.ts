import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as path from "path";
import * as semver from "semver";

export class InitService implements IInitService {
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
		private $npm: INodePackageManager,
		private $npmInstallationManager: INpmInstallationManager) { }

	public initialize(): IFuture<void> {
		return (() => {
			let projectData: any = {};

			if (this.$fs.exists(this.projectFilePath)) {
				projectData = this.$fs.readJson(this.projectFilePath);
			}

			let projectDataBackup = _.extend({}, projectData);

			if (!projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]) {
				projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = {};
				this.$fs.writeJson(this.projectFilePath, projectData); // We need to create package.json file here in order to prevent "No project found at or above and neither was a --path specified." when resolving platformsData
			}

			try {

				projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]["id"] = this.getProjectId().wait();

				if (this.$options.frameworkName && this.$options.frameworkVersion) {
					let currentPlatformData = projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][this.$options.frameworkName] || {};

					projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][this.$options.frameworkName] = _.extend(currentPlatformData, this.buildVersionData(this.$options.frameworkVersion));
				} else {
					let $platformsData = this.$injector.resolve("platformsData");
					_.each($platformsData.platformsNames, platform => {
						let platformData: IPlatformData = $platformsData.getPlatformData(platform);
						if (!platformData.targetedOS || (platformData.targetedOS && _.includes(platformData.targetedOS, process.platform))) {
							let currentPlatformData = projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][platformData.frameworkPackageName] || {};

							projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][platformData.frameworkPackageName] = _.extend(currentPlatformData, this.getVersionData(platformData.frameworkPackageName).wait());
						}
					});
				}

				let dependencies = projectData.dependencies;
				if (!dependencies) {
					projectData.dependencies = Object.create(null);
				}
				// In case console is interactive and --force is not specified, do not read the version from package.json, show all available versions to the user.
				let tnsCoreModulesVersionInPackageJson = this.useDefaultValue ? projectData.dependencies[constants.TNS_CORE_MODULES_NAME] : null;
				projectData.dependencies[constants.TNS_CORE_MODULES_NAME] = this.$options.tnsModulesVersion || tnsCoreModulesVersionInPackageJson || this.getVersionData(constants.TNS_CORE_MODULES_NAME).wait()["version"];

				this.$fs.writeJson(this.projectFilePath, projectData);
			} catch (err) {
				this.$fs.writeJson(this.projectFilePath, projectDataBackup);
				throw err;
			}

			this.$logger.out("Project successfully initialized.");
		}).future<void>()();
	}

	private get projectFilePath(): string {
		if (!this._projectFilePath) {
			let projectDir = path.resolve(this.$options.path || ".");
			this._projectFilePath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
		}

		return this._projectFilePath;
	}

	private getProjectId(): IFuture<string> {
		return (() => {
			if (this.$options.appid) {
				return this.$options.appid;
			}

			let defaultAppId = this.$projectHelper.generateDefaultAppId(path.basename(path.dirname(this.projectFilePath)), constants.DEFAULT_APP_IDENTIFIER_PREFIX);
			if (this.useDefaultValue) {
				return defaultAppId;
			}

			return this.$prompter.getString("Id:", { defaultAction: () => defaultAppId }).wait();
		}).future<string>()();
	}

	private getVersionData(packageName: string): IFuture<IStringDictionary> {
		return (() => {
			let latestVersion = this.$npmInstallationManager.getLatestCompatibleVersion(packageName).wait();

			if (this.useDefaultValue) {
				return this.buildVersionData(latestVersion);
			}

			let data:any = this.$npm.view(packageName, "versions").wait();
			let versions = _.filter(data[latestVersion].versions, (version: string) => semver.gte(version, InitService.MIN_SUPPORTED_FRAMEWORK_VERSIONS[packageName]));
			if (versions.length === 1) {
				this.$logger.info(`Only ${versions[0]} version is available for ${packageName}.`);
				return this.buildVersionData(versions[0]);
			}
			let sortedVersions = versions.sort(helpers.versionCompare).reverse();
			//TODO: plamen5kov: don't offer versions from next (they are not available)
			let version = this.$prompter.promptForChoice(`${packageName} version:`, sortedVersions).wait();
			return this.buildVersionData(version);
		}).future<IStringDictionary>()();
	}

	private buildVersionData(version: string): IStringDictionary {
		let result: IStringDictionary = {};

		result[InitService.VERSION_KEY_NAME] = version;

		return result;
	}

	private get useDefaultValue(): boolean {
		return !helpers.isInteractive() || this.$options.force;
	}
}
$injector.register("initService", InitService);
