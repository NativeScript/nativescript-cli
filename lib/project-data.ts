import * as constants from "./constants";
import * as path from "path";
import { parseJson } from "./common/helpers";
import { EOL } from "os";
import { cache } from "./common/decorators";

interface IProjectType {
	type: string;
	requiredDependencies?: string[];
	isDefaultProjectType?: boolean;
}

export class ProjectData implements IProjectData {
	/**
	 * NOTE: Order of the elements is important as the TypeScript dependencies are commonly included in Angular project as well.
	 */
	private static PROJECT_TYPES: IProjectType[] = [
		{
			type: constants.ProjectTypes.JsFlavorName,
			isDefaultProjectType: true
		},
		{
			type: constants.ProjectTypes.NgFlavorName,
			requiredDependencies: ["@angular/core", "nativescript-angular"]
		},
		{
			type: constants.ProjectTypes.VueFlavorName,
			requiredDependencies: ["nativescript-vue"]
		},
		{
			type: constants.ProjectTypes.ReactFlavorName,
			requiredDependencies: ["react-nativescript"]
		},
		{
			type: constants.ProjectTypes.SvelteFlavorName,
			requiredDependencies: ["svelte-native"]
		},
		{
			type: constants.ProjectTypes.TsFlavorName,
			requiredDependencies: ["typescript", "nativescript-dev-typescript"]
		}
	];

	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectIdentifiers: Mobile.IProjectIdentifier;
	get projectId(): string {
		this.warnProjectId();
		return this.projectIdentifiers.ios;
	}
	//just in case hook/extension modifies it.
	set projectId(identifier: string) {
		this.warnProjectId();
		this.projectIdentifiers.ios = identifier;
		this.projectIdentifiers.android = identifier;
	}
	public projectName: string;
	public nsConfig: INsConfig;
	public appDirectoryPath: string;
	public appResourcesDirectoryPath: string;
	public dependencies: any;
	public devDependencies: IStringDictionary;
	public projectType: string;
	public androidManifestPath: string;
	public infoPlistPath: string;
	public appGradlePath: string;
	public gradleFilesDirectoryPath: string;
	public buildXcconfigPath: string;
	public podfilePath: string;
	public isShared: boolean;
	public previewAppSchema: string;
  public webpackConfigPath: string;
  public isLegacy: boolean;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig,
		private $options: IOptions,
		private $logger: ILogger,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public initializeProjectData(projectDir?: string): void {
		projectDir = projectDir || this.$projectHelper.projectDir;

		// If no project found, projectDir should be null
		if (projectDir) {
			const projectFilePath = this.getProjectFilePath(projectDir);

			if (this.$fs.exists(projectFilePath)) {
				const packageJsonContent = this.$fs.readText(projectFilePath);
				const nsConfigContent = this.getNsConfigContent(projectDir);

				this.initializeProjectDataFromContent(packageJsonContent, nsConfigContent, projectDir);
			}

			return;
		}

		this.errorInvalidProject(projectDir);
	}

	public initializeProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): void {
		projectDir = projectDir || this.$projectHelper.projectDir || "";
		const projectFilePath = this.getProjectFilePath(projectDir);
		// If no project found, projectDir should be null
		let nsData = null;
		let nsConfig: INsConfig = null;
		let packageJsonData = null;

		try {
			packageJsonData = parseJson(packageJsonContent);
      nsData = packageJsonData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
      if (nsData) {
        this.isLegacy = true;
      }
		} catch (err) {
			this.$errors.fail(`The project file ${this.projectFilePath} is corrupted. ${EOL}` +
				`Consider restoring an earlier version from your source control or backup.${EOL}` +
				`Additional technical info: ${err.toString()}`);
		}

		try {
			nsConfig = nsconfigContent ? <INsConfig>parseJson(nsconfigContent) : null;
		} catch (err) {
			this.$errors.fail(`The NativeScript configuration file ${constants.CONFIG_NS_FILE_NAME} is corrupted. ${EOL}` +
				`Consider restoring an earlier version from your source control or backup.${EOL}` +
				`Additional technical info: ${err.toString()}`);
		}

    if (nsData && nsData.id || nsConfig) {
      this.projectDir = projectDir;
      this.projectName = this.$projectHelper.sanitizeName(path.basename(projectDir));
      this.platformsDir = path.join(projectDir, constants.PLATFORMS_DIR_NAME);
      this.projectFilePath = projectFilePath;
      this.projectIdentifiers = this.initializeProjectIdentifiers(nsData, nsConfig);
      this.dependencies = packageJsonData.dependencies;
      this.devDependencies = packageJsonData.devDependencies;
      this.projectType = this.getProjectType();
      this.nsConfig = nsConfig;
      this.appDirectoryPath = this.getAppDirectoryPath();
      this.appResourcesDirectoryPath = this.getAppResourcesDirectoryPath();
      this.androidManifestPath = this.getPathToAndroidManifest(this.appResourcesDirectoryPath);
      this.gradleFilesDirectoryPath = path.join(this.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android);
      this.appGradlePath = path.join(this.gradleFilesDirectoryPath, constants.APP_GRADLE_FILE_NAME);
      this.infoPlistPath = path.join(this.appResourcesDirectoryPath, this.$devicePlatformsConstants.iOS, constants.INFO_PLIST_FILE_NAME);
      this.buildXcconfigPath = path.join(this.appResourcesDirectoryPath, this.$devicePlatformsConstants.iOS, constants.BUILD_XCCONFIG_FILE_NAME);
      this.podfilePath = path.join(this.appResourcesDirectoryPath, this.$devicePlatformsConstants.iOS, constants.PODFILE_NAME);
      this.isShared = !!(this.nsConfig && this.nsConfig.shared);
      this.previewAppSchema = this.nsConfig && this.nsConfig.previewAppSchema;
      this.webpackConfigPath = (this.nsConfig && this.nsConfig.webpackConfigPath) ? path.resolve(this.projectDir, this.nsConfig.webpackConfigPath) : path.join(this.projectDir, "webpack.config.js");
      return;
    }

		this.errorInvalidProject(projectDir);
	}

	private getPathToAndroidManifest(appResourcesDir: string): string {
		const androidDirPath = path.join(appResourcesDir, this.$devicePlatformsConstants.Android);
		const androidManifestDir = this.$androidResourcesMigrationService.hasMigrated(appResourcesDir) ?
			path.join(androidDirPath, constants.SRC_DIR, constants.MAIN_DIR) :
			androidDirPath;

		return path.join(androidManifestDir, constants.MANIFEST_FILE_NAME);
	}

	private errorInvalidProject(projectDir: string): void {
		const currentDir = path.resolve(".");
		this.$logger.trace(`Unable to find project. projectDir: ${projectDir}, options.path: ${this.$options.path}, ${currentDir}`);

		// This is the case when no project file found
		this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", projectDir || this.$options.path || currentDir);
	}

	private getProjectFilePath(projectDir: string): string {
		return path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
	}

	public getAppResourcesDirectoryPath(projectDir?: string): string {
		const appResourcesRelativePath = this.getAppResourcesRelativeDirectoryPath();

		return this.resolveToProjectDir(appResourcesRelativePath, projectDir);
	}

	public getAppResourcesRelativeDirectoryPath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY];
		}

		return path.join(this.getAppDirectoryRelativePath(), constants.APP_RESOURCES_FOLDER_NAME);
	}

	public getAppDirectoryPath(projectDir?: string): string {
		const appRelativePath = this.getAppDirectoryRelativePath();

		return this.resolveToProjectDir(appRelativePath, projectDir);
	}

	public getAppDirectoryRelativePath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_APP_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_APP_ENTRY];
		}

		return constants.APP_FOLDER_NAME;
	}

	private getNsConfigContent(projectDir: string): string {
		if (!projectDir) {
			return null;
		}

		const configNSFilePath = path.join(projectDir, this.getNsConfigRelativePath());

		if (!this.$fs.exists(configNSFilePath)) {
			return null;
		}

		return this.$fs.readText(configNSFilePath);
	}

	public getNsConfigRelativePath(): string {
		return constants.CONFIG_NS_FILE_NAME;
	}

	private resolveToProjectDir(pathToResolve: string, projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		if (!projectDir) {
			return null;
		}

		return path.resolve(projectDir, pathToResolve);
	}

	private initializeProjectIdentifiers(nsData: any, nsConfig?: INsConfig): Mobile.IProjectIdentifier {
		let identifier: Mobile.IProjectIdentifier = {};
    const data = nsData ? nsData.id : "";
    
    if (nsConfig && nsConfig.id) {
      // using latest nsconfig driven project data
      identifier = {
        android: nsConfig.id,
        ios: nsConfig.id
      };
    } else if (typeof data === "string") {
      // legacy "nativescript" key in package.json with embedded id
      this.isLegacy = true;
			identifier = {
				android: data,
				ios: data
			};
		} else {
      // legacy 
      this.isLegacy = true;
			identifier = {
				android: data.android || "",
				ios: data.ios || ""
			};
    }
    
    if (nsConfig) {
      // platform overrides (which can define separate and distinct bundle ids if needed)
      if (nsConfig.ios && nsConfig.ios.id) {
        identifier.ios = nsConfig.ios.id;
      }
      if (nsConfig.android && nsConfig.android.id) {
        identifier.android = nsConfig.android.id;
      }
    }

		return identifier;
	}

	private getProjectType(): string {
		let detectedProjectType = _.find(ProjectData.PROJECT_TYPES, (projectType) => projectType.isDefaultProjectType).type;

		const deps: string[] = _.keys(this.dependencies).concat(_.keys(this.devDependencies));

		_.each(ProjectData.PROJECT_TYPES, projectType => {
			if (_.some(projectType.requiredDependencies, requiredDependency => deps.indexOf(requiredDependency) !== -1)) {
				detectedProjectType = projectType.type;
				return false;
			}
		});

		return detectedProjectType;
	}

	@cache()
	private warnProjectId(): void {
		this.$logger.warn("[WARNING]: IProjectData.projectId is deprecated. Please use IProjectData.projectIdentifiers[platform].");
	}
}
$injector.register("projectData", ProjectData, true);
