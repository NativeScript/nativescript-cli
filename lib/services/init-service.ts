///<reference path="../.d.ts"/>
"use strict";

import constants = require("../constants");
import * as helpers from "../common/helpers";
import * as path from "path";
import semver = require("semver");

export class InitService implements IInitService {
	private static MIN_SUPPORTED_FRAMEWORK_VERSIONS: IStringDictionary = {
		"tns-ios": "1.1.0",
		"tns-android": "1.1.0"	
	};
	
	private _projectFilePath: string;
	
	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
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
			let projectData: any = { };
			
			if(this.$fs.exists(this.projectFilePath).wait()) {
				projectData = this.$fs.readJson(this.projectFilePath).wait();
			}
			
			let projectDataBackup = _.extend({}, projectData);			
			
			if(!projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]) {
				projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = { };
				this.$fs.writeJson(this.projectFilePath, projectData).wait(); // We need to create package.json file here in order to prevent "No project found at or above and neither was a --path specified." when resolving platformsData				
			}
			
			try {
				
				projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]["id"] = this.getProjectId().wait();
				
				if(this.$options.frameworkName && this.$options.frameworkVersion) {
					projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][this.$options.frameworkName] = this.buildVersionData(this.$options.frameworkVersion);
				} else {
					let $platformsData = this.$injector.resolve("platformsData");
					_.each($platformsData.platformsNames, platform => {
						let platformData: IPlatformData = $platformsData.getPlatformData(platform);
						if(!platformData.targetedOS || (platformData.targetedOS && _.contains(platformData.targetedOS, process.platform))) {
							projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][platformData.frameworkPackageName] = this.getVersionData(platformData.frameworkPackageName).wait();
						}
					});
				}
				
				this.$fs.writeJson(this.projectFilePath, projectData).wait();
			} catch(err) {
				this.$fs.writeJson(this.projectFilePath, projectDataBackup).wait();
				throw err;
			}
			
			this.$logger.out("Project successfully initialized."); 
		}).future<void>()();
	}
	
	private get projectFilePath(): string {
		if(!this._projectFilePath) {
			let projectDir = path.resolve(this.$options.path || ".");
			this._projectFilePath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
		}
		
		return this._projectFilePath;
	}
	
	private getProjectId(): IFuture<string> {
		return (() => {
			if(this.$options.appid) {
				return this.$options.appid;
			}
			
			let defaultAppId = this.$projectHelper.generateDefaultAppId(path.basename(path.dirname(this.projectFilePath)), constants.DEFAULT_APP_IDENTIFIER_PREFIX);
			if(this.useDefaultValue) {
				return defaultAppId;
			}
			
			return this.$prompter.getString("Id:", () => defaultAppId).wait();
		}).future<string>()();
	}
	
	private getVersionData(packageName: string): IFuture<IStringDictionary> {
		return (() => {
			let latestVersion = this.$npmInstallationManager.getLatestVersion(packageName).wait();
			if(this.useDefaultValue) {
				return this.buildVersionData(latestVersion);
			}
			
			let data = this.$npm.view(packageName, "versions").wait();
			let versions = _.filter(data[latestVersion].versions, (version: string) => semver.gte(version, InitService.MIN_SUPPORTED_FRAMEWORK_VERSIONS[packageName]));
			if(versions.length === 1) {
				this.$logger.info(`Only ${versions[0]} version is available for ${packageName} framework.`);
				return this.buildVersionData(versions[0]);
			}
			let sortedVersions = versions.sort(helpers.versionCompare).reverse();
			let version = this.$prompter.promptForChoice(`${packageName} version:`, sortedVersions).wait();
			return this.buildVersionData(version);
		}).future<IStringDictionary>()();
	}
	
	private buildVersionData(version: string): IStringDictionary {
		 return { "version": version };
	}
	
	private get useDefaultValue(): boolean {
		return !helpers.isInteractive() || this.$options.force;
	}
}
$injector.register("initService", InitService);
