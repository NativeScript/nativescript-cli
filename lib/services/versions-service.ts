import * as constants from "../constants";
import * as semver from "semver";
import * as path from "path";
import { createTable } from "../common/helpers";

class VersionsService implements IVersionsService {
	private static UP_TO_DATE_MESSAGE = "Up to date".green.toString();
	private static UPDATE_AVAILABLE_MESSAGE = "Update available".yellow.toString();
	private static NOT_INSTALLED_MESSAGE = "Not installed".grey.toString();

	private projectData: IProjectData;

	constructor(private $fs: IFileSystem,
		private $npmInstallationManager: INpmInstallationManager,
		private $injector: IInjector,
		private $staticConfig: Config.IStaticConfig,
		private $pluginsService: IPluginsService) {
		this.projectData = this.getProjectData();
	}

	public async getNativescriptCliVersion(): Promise<IVersionInformation> {
		let currentCliVersion = this.$staticConfig.version;
		let latestCliVersion = await this.$npmInstallationManager.getLatestVersion(constants.NATIVESCRIPT_KEY_NAME);

		return {
			componentName: constants.NATIVESCRIPT_KEY_NAME,
			currentVersion: currentCliVersion,
			latestVersion: latestCliVersion
		};
	}

	public async getTnsCoreModulesVersion(): Promise<IVersionInformation> {
		let latestTnsCoreModulesVersion = await this.$npmInstallationManager.getLatestVersion(constants.TNS_CORE_MODULES_NAME);
		let nativescriptCoreModulesInfo: IVersionInformation = {
			componentName: constants.TNS_CORE_MODULES_NAME,
			latestVersion: latestTnsCoreModulesVersion
		};

		if (this.projectData) {
			let nodeModulesPath = path.join(this.projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME);
			let tnsCoreModulesPath = path.join(nodeModulesPath, constants.TNS_CORE_MODULES_NAME);
			if (!this.$fs.exists(nodeModulesPath) ||
				!this.$fs.exists(tnsCoreModulesPath)) {
				await this.$pluginsService.ensureAllDependenciesAreInstalled();
			}

			let currentTnsCoreModulesVersion = this.$fs.readJson(path.join(tnsCoreModulesPath, constants.PACKAGE_JSON_FILE_NAME)).version;
			nativescriptCoreModulesInfo.currentVersion = currentTnsCoreModulesVersion;
		}

		return nativescriptCoreModulesInfo;
	}

	public async getRuntimesVersions(): Promise<IVersionInformation[]> {
		let runtimes: string[] = [
			constants.TNS_ANDROID_RUNTIME_NAME,
			constants.TNS_IOS_RUNTIME_NAME
		];

		let projectConfig: any;

		if (this.projectData) {
			projectConfig = this.$fs.readJson(this.projectData.projectFilePath);
		}

		let runtimesVersions: IVersionInformation[] = await Promise.all(runtimes.map(async (runtime: string) => {
			let latestRuntimeVersion = await this.$npmInstallationManager.getLatestVersion(runtime);
			let runtimeInformation: IVersionInformation = {
				componentName: runtime,
				latestVersion: latestRuntimeVersion
			};

			if (projectConfig) {
				let projectRuntimeInformation = projectConfig.nativescript && projectConfig.nativescript[runtime];
				if (projectRuntimeInformation) {
					let runtimeVersionInProject = projectRuntimeInformation.version;
					runtimeInformation.currentVersion = runtimeVersionInProject;
				}
			}

			return runtimeInformation;
		}));

		return runtimesVersions;
	}

	public async getComponentsForUpdate(): Promise<IVersionInformation[]> {
		let allComponents: IVersionInformation[] = await this.getAllComponentsVersions();
		let componentsForUpdate: IVersionInformation[] = [];

		_.forEach(allComponents, (component: IVersionInformation) => {
			if (component.currentVersion && this.hasUpdate(component)) {
				componentsForUpdate.push(component);
			}
		});

		return componentsForUpdate;
	}

	public async getAllComponentsVersions(): Promise<IVersionInformation[]> {
		let allComponents: IVersionInformation[] = [];

		let nativescriptCliInformation: IVersionInformation = await this.getNativescriptCliVersion();
		if (nativescriptCliInformation) {
			allComponents.push(nativescriptCliInformation);
		}

		let nativescriptCoreModulesInformation: IVersionInformation = await this.getTnsCoreModulesVersion();
		if (nativescriptCoreModulesInformation) {
			allComponents.push(nativescriptCoreModulesInformation);
		}

		let runtimesVersions: IVersionInformation[] = await this.getRuntimesVersions();

		allComponents = allComponents.concat(runtimesVersions);

		return allComponents;
	}

	public createTableWithVersionsInformation(versionsInformation: IVersionInformation[]): any {
		let headers = ["Component", "Current version", "Latest version", "Information"];
		let data: string[][] = [];

		_.forEach(versionsInformation, (componentInformation: IVersionInformation) => {
			let row: string[] = [
				componentInformation.componentName,
				componentInformation.currentVersion,
				componentInformation.latestVersion
			];

			if (componentInformation.currentVersion) {
				semver.lt(componentInformation.currentVersion, componentInformation.latestVersion) ? row.push(VersionsService.UPDATE_AVAILABLE_MESSAGE) : row.push(VersionsService.UP_TO_DATE_MESSAGE);
			} else {
				row.push(VersionsService.NOT_INSTALLED_MESSAGE);
			}

			data.push(row);
		});

		return createTable(headers, data);
	}

	private getProjectData(): IProjectData {
		try {
			return this.$injector.resolve("projectData");
		} catch (error) {
			return null;
		}
	}

	private hasUpdate(component: IVersionInformation): boolean {
		return semver.lt(component.currentVersion, component.latestVersion);
	}
}

$injector.register("versionsService", VersionsService);
