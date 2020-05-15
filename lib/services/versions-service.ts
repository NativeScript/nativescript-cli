import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import * as path from "path";

export enum VersionInformationType {
	UpToDate = "UpToDate",
	UpdateAvailable = "UpdateAvailable",
	NotInstalled = "NotInstalled"
}

class VersionsService implements IVersionsService {
	private static UP_TO_DATE_MESSAGE = "up to date";
	private static UPDATE_AVAILABLE_MESSAGE = "Update available";
	private static NOT_INSTALLED_MESSAGE = "not installed";

	private projectData: IProjectData;

	constructor(private $fs: IFileSystem,
		private $packageInstallationManager: IPackageInstallationManager,
		private $injector: IInjector,
		private $logger: ILogger,
		private $staticConfig: Config.IStaticConfig,
		private $pluginsService: IPluginsService,
		private $terminalSpinnerService: ITerminalSpinnerService) {
		this.projectData = this.getProjectData();
	}

	public async getNativescriptCliVersion(): Promise<IVersionInformation> {
		const currentCliVersion = this.$staticConfig.version;
		const latestCliVersion = await this.$packageInstallationManager.getLatestVersion(constants.NATIVESCRIPT_KEY_NAME);

		return {
			componentName: constants.NATIVESCRIPT_KEY_NAME,
			currentVersion: currentCliVersion,
			latestVersion: latestCliVersion
		};
	}

	public async getTnsCoreModulesVersion(): Promise<IVersionInformation[]> {
		const latestTnsCoreModulesVersion = await this.$packageInstallationManager.getLatestVersion(constants.TNS_CORE_MODULES_NAME);
		const nativescriptCoreModulesInfo: IVersionInformation = {
			componentName: constants.TNS_CORE_MODULES_NAME,
			latestVersion: latestTnsCoreModulesVersion
		};

		const versionInformations: IVersionInformation[] = [];

		if (this.projectData) {
			const nodeModulesPath = path.join(this.projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME);
			const scopedPackagePath = path.join(nodeModulesPath, constants.SCOPED_TNS_CORE_MODULES);
			const tnsCoreModulesPath = path.join(nodeModulesPath, constants.TNS_CORE_MODULES_NAME);

			const dependsOnNonScopedPackage = !!this.projectData.dependencies[constants.TNS_CORE_MODULES_NAME];
			const dependsOnScopedPackage = !!this.projectData.dependencies[constants.SCOPED_TNS_CORE_MODULES];

			// ensure the dependencies are installed, so we can get their actual versions from node_modules
			if (!this.$fs.exists(nodeModulesPath) ||
				(dependsOnNonScopedPackage && !this.$fs.exists(tnsCoreModulesPath)) ||
				(dependsOnScopedPackage && !this.$fs.exists(scopedPackagePath))) {
				await this.$pluginsService.ensureAllDependenciesAreInstalled(this.projectData);
			}

			if (dependsOnNonScopedPackage && this.$fs.exists(tnsCoreModulesPath)) {
				const currentTnsCoreModulesVersion = this.$fs.readJson(path.join(tnsCoreModulesPath, constants.PACKAGE_JSON_FILE_NAME)).version;
				nativescriptCoreModulesInfo.currentVersion = currentTnsCoreModulesVersion;
				versionInformations.push(nativescriptCoreModulesInfo);
			}

			if (dependsOnScopedPackage && this.$fs.exists(scopedPackagePath)) {
				const scopedModulesInformation: IVersionInformation = {
					componentName: constants.SCOPED_TNS_CORE_MODULES,
					latestVersion: await this.$packageInstallationManager.getLatestVersion(constants.SCOPED_TNS_CORE_MODULES)
				};

				const currentScopedPackageVersion = this.$fs.readJson(path.join(scopedPackagePath, constants.PACKAGE_JSON_FILE_NAME)).version;
				scopedModulesInformation.currentVersion = currentScopedPackageVersion;
				versionInformations.push(scopedModulesInformation);
			}
		} else {
			versionInformations.push(nativescriptCoreModulesInfo);
		}

		return versionInformations;
	}

	public async getRuntimesVersions(): Promise<IVersionInformation[]> {
		let runtimes: string[];

		let projectConfig: any;

		if (this.projectData) {
      projectConfig = this.$fs.readJson(this.projectData.projectFilePath);
      
      if (this.projectData.isLegacy) {
        runtimes = [
          constants.TNS_ANDROID_RUNTIME_NAME,
          constants.TNS_IOS_RUNTIME_NAME
        ];
      } else {
        runtimes = [
          constants.SCOPED_ANDROID_RUNTIME_NAME,
          constants.SCOPED_IOS_RUNTIME_NAME
        ];
      }
		}

		const runtimesVersions: IVersionInformation[] = await Promise.all(runtimes.map(async (runtime: string) => {
			const latestRuntimeVersion = await this.$packageInstallationManager.getLatestVersion(runtime);
			const runtimeInformation: IVersionInformation = {
				componentName: runtime,
				latestVersion: latestRuntimeVersion
			};

			if (projectConfig) {
				const projectRuntimeInformation = projectConfig.nativescript && projectConfig.nativescript[runtime];
				if (projectRuntimeInformation) {
					const runtimeVersionInProject = projectRuntimeInformation.version;
					runtimeInformation.currentVersion = runtimeVersionInProject;
				}
			}

			return runtimeInformation;
		}));

		return runtimesVersions;
	}

	public async getAllComponentsVersions(): Promise<IVersionInformation[]> {
		let allComponents: IVersionInformation[] = [];

		const nativescriptCliInformation: IVersionInformation = await this.getNativescriptCliVersion();
		if (nativescriptCliInformation) {
			allComponents.push(nativescriptCliInformation);
		}

		if (this.projectData) {
			const nativescriptCoreModulesInformation: IVersionInformation[] = await this.getTnsCoreModulesVersion();
			if (nativescriptCoreModulesInformation) {
				allComponents.push(...nativescriptCoreModulesInformation);
			}

			const runtimesVersions: IVersionInformation[] = await this.getRuntimesVersions();
			allComponents = allComponents.concat(runtimesVersions);
		}

		return allComponents
			.map(componentInformation => {
				if (componentInformation.currentVersion) {
					if (this.hasUpdate(componentInformation)) {
						componentInformation.type = VersionInformationType.UpdateAvailable;
						componentInformation.message = `${VersionsService.UPDATE_AVAILABLE_MESSAGE} for component ${componentInformation.componentName}. Your current version is ${componentInformation.currentVersion} and the latest available version is ${componentInformation.latestVersion}.`;
					} else {
						componentInformation.type = VersionInformationType.UpToDate;
						componentInformation.message = `Component ${componentInformation.componentName} has ${componentInformation.currentVersion} version and is ${VersionsService.UP_TO_DATE_MESSAGE}.`;
					}
				} else {
					componentInformation.type = VersionInformationType.NotInstalled;
					componentInformation.message = `Component ${componentInformation.componentName} is ${VersionsService.NOT_INSTALLED_MESSAGE}.`;
				}

				return componentInformation;
			});
	}

	public async printVersionsInformation(): Promise<void> {
		const versionsInformation = await this.$terminalSpinnerService.execute<IVersionInformation[]>({
			text: `Getting NativeScript components versions information...`
		}, () => this.getAllComponentsVersions());

		if (!helpers.isInteractive()) {
			versionsInformation.map(componentInformation => this.$logger.info(componentInformation.message));
		}

		_.forEach(versionsInformation, componentInformation => {
			const spinner = this.$terminalSpinnerService.createSpinner();
			spinner.text = componentInformation.message;

			switch (componentInformation.type) {
				case VersionInformationType.UpToDate:
					spinner.succeed();
					break;
				case VersionInformationType.UpdateAvailable:
					spinner.warn();
					break;
				case VersionInformationType.NotInstalled:
					spinner.fail();
					break;
			}
		});
	}

	private getProjectData(): IProjectData {
		try {
			const projectData: IProjectData = this.$injector.resolve("projectData");
			projectData.initializeProjectData();
			return projectData;
		} catch (error) {
			return null;
		}
	}

	private hasUpdate(component: IVersionInformation): boolean {
		return semver.lt(component.currentVersion, component.latestVersion);
	}
}

$injector.register("versionsService", VersionsService);
