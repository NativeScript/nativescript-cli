///<reference path="../.d.ts"/>
"use strict";
import * as constants from "../constants";
import * as semver from "semver";
import {createTable} from "../common/helpers";

class VersionsService implements IVersionsService {
	private projectData: IProjectData;

	constructor(private $fs: IFileSystem,
		private $npmInstallationManager: INpmInstallationManager,
		private $injector: IInjector,
		private $staticConfig: Config.IStaticConfig) {
		this.projectData = this.getProjectData();
	}

	public getNativescriptCliVersion(): IFuture<IVersionInformation> {
		return (() => {
			let currentCliVersion = this.$staticConfig.version;
			let latestCliVersion = this.$npmInstallationManager.getLatestVersion(constants.NATIVESCRIPT_KEY_NAME).wait();

			return {
				componentName: constants.NATIVESCRIPT_KEY_NAME,
				currentVersion: currentCliVersion,
				latestVersion: latestCliVersion
			};
		}).future<IVersionInformation>()();
	}

	public getTnsCoreModulesVersion(): IFuture<IVersionInformation> {
		return (() => {
			let latestTnsCoreModulesVersion = this.$npmInstallationManager.getLatestVersion(constants.TNS_CORE_MODULES_NAME).wait();
			let nativescriptCoreModulesInfo: IVersionInformation = {
				componentName: constants.TNS_CORE_MODULES_NAME,
				latestVersion: latestTnsCoreModulesVersion
			};

			if (this.projectData) {
				let currentTnsCoreModulesVersion = this.projectData.dependencies[constants.TNS_CORE_MODULES_NAME];
				nativescriptCoreModulesInfo.currentVersion = currentTnsCoreModulesVersion;
			}

			return nativescriptCoreModulesInfo;
		}).future<IVersionInformation>()();
	}

	public getRuntimesVersions(): IFuture<IVersionInformation[]> {
		return (() => {
			let runtimes: string[] = [
				constants.TNS_ANDROID_RUNTIME_NAME,
				constants.TNS_IOS_RUNTIME_NAME
			];

			let projectConfig: any;

			if (this.projectData) {
				projectConfig = this.$fs.readJson(this.projectData.projectFilePath).wait();
			}

			let runtimesVersions: IVersionInformation[] = runtimes.map((runtime: string) => {
				let latestRuntimeVersion = this.$npmInstallationManager.getLatestVersion(runtime).wait();
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
			});

			return runtimesVersions;
		}).future<IVersionInformation[]>()();
	}

	public getComponentsForUpdate(): IFuture<IVersionInformation[]> {
		return (() => {
			let allComponents: IVersionInformation[] = this.getAllComponentsVersions().wait();
			let componentsForUpdate: IVersionInformation[] = [];

			_.forEach(allComponents, (component: IVersionInformation) => {
				if (component.currentVersion && this.hasUpdate(component)) {
					componentsForUpdate.push(component);
				}
			});

			return componentsForUpdate;
		}).future<IVersionInformation[]>()();
	}

	public getAllComponentsVersions(): IFuture<IVersionInformation[]> {
		return (() => {
			let allComponents: IVersionInformation[] = [];

			let nativescriptCliInformation: IVersionInformation = this.getNativescriptCliVersion().wait();
			if (nativescriptCliInformation) {
				allComponents.push(nativescriptCliInformation);
			}

			let nativescriptCoreModulesInformation: IVersionInformation = this.getTnsCoreModulesVersion().wait();
			if (nativescriptCoreModulesInformation) {
				allComponents.push(nativescriptCoreModulesInformation);
			}

			let runtimesVersions: IVersionInformation[] = this.getRuntimesVersions().wait();

			allComponents = allComponents.concat(runtimesVersions);

			return allComponents;
		}).future<IVersionInformation[]>()();
	}

	public createTableWithVersionsInformation(versionsInformation: IVersionInformation[]): any {
		let headers = ["Component", "Current version", "Latest version", "Information"];
		let data: string[][] = [];
		let upToDate: string = "Up to date".green.toString();

		_.forEach(versionsInformation, (componentInformation: IVersionInformation) => {
			let row: string[] = [
				componentInformation.componentName,
				componentInformation.currentVersion || "",
				componentInformation.latestVersion
			];

			if (componentInformation.currentVersion && semver.lt(componentInformation.currentVersion, componentInformation.latestVersion)) {
				row.push("Update available".yellow.toString());
			} else {
				row.push(upToDate);
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
