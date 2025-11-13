import * as constants from "./constants";
import * as path from "path";
import * as _ from "lodash";
import { parseJson } from "./common/helpers";
import { EOL } from "os";
import { cache } from "./common/decorators";
import {
	BundlerType,
	INsConfig,
	IProjectConfigService,
	IProjectData,
} from "./definitions/project";
import {
	IAndroidResourcesMigrationService,
	IOptions,
	IStaticConfig,
} from "./declarations";
import {
	IErrors,
	IFileSystem,
	IProjectHelper,
	IStringDictionary,
} from "./common/declarations";
import { injector } from "./common/yok";
import { IInjector } from "./common/definitions/yok";

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
			isDefaultProjectType: true,
		},
		{
			type: constants.ProjectTypes.NgFlavorName,
			requiredDependencies: [
				"@angular/core",
				"nativescript-angular",
				"@nativescript/angular",
			],
		},
		{
			type: constants.ProjectTypes.VueFlavorName,
			requiredDependencies: ["nativescript-vue"],
		},
		{
			type: constants.ProjectTypes.ReactFlavorName,
			requiredDependencies: ["react-nativescript"],
		},
		{
			type: constants.ProjectTypes.SvelteFlavorName,
			requiredDependencies: ["svelte-native"],
		},
		{
			type: constants.ProjectTypes.TsFlavorName,
			requiredDependencies: ["typescript", "nativescript-dev-typescript"],
		},
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
		this.projectIdentifiers.visionos = identifier;
	}

	public projectName: string;
	public packageJsonData: any;
	public nsConfig: INsConfig;
	public appDirectoryPath: string;
	public appResourcesDirectoryPath: string;
	public dependencies: any;
	public devDependencies: IStringDictionary;
	public ignoredDependencies: string[];
	public projectType: string;
	public androidManifestPath: string;
	public infoPlistPath: string;
	public appGradlePath: string;
	public gradleFilesDirectoryPath: string;
	public buildXcconfigPath: string;
	public podfilePath: string;
	public isShared: boolean;
	public webpackConfigPath: string;
	public bundlerConfigPath: string;
	public bundler: BundlerType;
	public initialized: boolean;

	constructor(
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig,
		private $options: IOptions,
		private $logger: ILogger,
		private $injector: IInjector,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
	) {}

	get projectConfig(): IProjectConfigService {
		return this.$injector.resolve("projectConfigService");
	}

	public initializeProjectData(projectDir?: string): void {
		if (this.initialized) {
			return;
		}
		projectDir = projectDir || this.$projectHelper.projectDir;

		// If no project found, projectDir should be null
		if (projectDir) {
			const projectFilePath = this.getProjectFilePath(projectDir);

			if (this.$fs.exists(projectFilePath)) {
				const packageJsonContent = this.$fs.readText(projectFilePath);

				this.initializeProjectDataFromContent(packageJsonContent, projectDir);
				this.initialized = true;
			}

			return;
		}

		this.errorInvalidProject(projectDir);
	}

	public initializeProjectDataFromContent(
		packageJsonContent: string,
		projectDir?: string,
	): void {
		projectDir = projectDir || this.$projectHelper.projectDir || "";
		this.projectDir = projectDir;

		const projectFilePath = this.getProjectFilePath(projectDir);
		const nsConfig: INsConfig = this.projectConfig.readConfig(projectDir);
		let packageJsonData = null;

		try {
			packageJsonData = parseJson(packageJsonContent);
		} catch (err) {
			this.$errors.fail(
				`The project file ${this.projectFilePath} is corrupted. ${EOL}` +
					`Consider restoring an earlier version from your source control or backup.${EOL}` +
					`Additional technical info: ${err.toString()}`,
			);
		}

		if (packageJsonData) {
			this.projectName =
				nsConfig && nsConfig.projectName
					? nsConfig.projectName
					: this.$projectHelper.sanitizeName(path.basename(projectDir));
			this.nsConfig = nsConfig;
			this.platformsDir = path.join(
				projectDir,
				this.getBuildRelativeDirectoryPath()
			);
			this.projectFilePath = projectFilePath;
			this.projectIdentifiers = this.initializeProjectIdentifiers(nsConfig);
			this.packageJsonData = packageJsonData;
			this.dependencies = packageJsonData.dependencies;
			this.devDependencies = packageJsonData.devDependencies;
			this.projectType = this.getProjectType();
			this.ignoredDependencies = nsConfig?.ignoredNativeDependencies;
			this.appDirectoryPath = this.getAppDirectoryPath();
			this.appResourcesDirectoryPath = this.getAppResourcesDirectoryPath();
			this.androidManifestPath = this.getPathToAndroidManifest(
				this.appResourcesDirectoryPath,
			);
			this.gradleFilesDirectoryPath = path.join(
				this.appResourcesDirectoryPath,
				this.$devicePlatformsConstants.Android,
			);
			this.appGradlePath = path.join(
				this.gradleFilesDirectoryPath,
				constants.APP_GRADLE_FILE_NAME,
			);
			this.infoPlistPath = path.join(
				this.appResourcesDirectoryPath,
				this.$devicePlatformsConstants.iOS,
				constants.INFO_PLIST_FILE_NAME,
			);
			this.buildXcconfigPath = path.join(
				this.appResourcesDirectoryPath,
				this.$devicePlatformsConstants.iOS,
				constants.BUILD_XCCONFIG_FILE_NAME,
			);
			this.podfilePath = path.join(
				this.appResourcesDirectoryPath,
				this.$devicePlatformsConstants.iOS,
				constants.PODFILE_NAME,
			);
			this.isShared = !!(this.nsConfig && this.nsConfig.shared);

			const webpackConfigPath =
				this.nsConfig && this.nsConfig.webpackConfigPath
					? path.resolve(this.projectDir, this.nsConfig.webpackConfigPath)
					: path.join(this.projectDir, "webpack.config.js");
			this.webpackConfigPath = webpackConfigPath;
			this.bundlerConfigPath =
				this.nsConfig && this.nsConfig.bundlerConfigPath
					? path.resolve(this.projectDir, this.nsConfig.bundlerConfigPath)
					: webpackConfigPath;
			this.bundler = this?.nsConfig?.bundler ?? "webpack";
			return;
		}

		this.errorInvalidProject(projectDir);
	}

	private getPathToAndroidManifest(appResourcesDir: string): string {
		const androidDirPath = path.join(
			appResourcesDir,
			this.$devicePlatformsConstants.Android,
		);
		const androidManifestDir =
			this.$androidResourcesMigrationService.hasMigrated(appResourcesDir)
				? path.join(androidDirPath, constants.SRC_DIR, constants.MAIN_DIR)
				: androidDirPath;

		return path.join(androidManifestDir, constants.MANIFEST_FILE_NAME);
	}

	private errorInvalidProject(projectDir: string): void {
		const currentDir = path.resolve(".");
		this.$logger.trace(
			`Unable to find project. projectDir: ${projectDir}, options.path: ${this.$options.path}, ${currentDir}`,
		);

		// This is the case when no project file found
		this.$errors.fail(
			"No project found at or above '%s' and neither was a --path specified.",
			projectDir || this.$options.path || currentDir,
		);
	}

	private getProjectFilePath(projectDir: string): string {
		return path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
	}

	public getAppResourcesDirectoryPath(projectDir?: string): string {
		const appResourcesRelativePath =
			this.getAppResourcesRelativeDirectoryPath();

		return this.resolveToProjectDir(appResourcesRelativePath, projectDir);
	}

	public getAppResourcesRelativeDirectoryPath(): string {
		if (
			this.nsConfig &&
			this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY]
		) {
			return this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY];
		}

		return constants.APP_RESOURCES_FOLDER_NAME;
		// return path.join(
		// 	this.getAppDirectoryRelativePath(),
		// 	constants.APP_RESOURCES_FOLDER_NAME
		// );
	}

	public getAppDirectoryPath(projectDir?: string): string {
		const appRelativePath = this.getAppDirectoryRelativePath();

		return this.resolveToProjectDir(appRelativePath, projectDir);
	}

	public getBuildRelativeDirectoryPath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_BUILD_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_BUILD_ENTRY];
		}

		return constants.PLATFORMS_DIR_NAME;
	}

	public getAppDirectoryRelativePath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_APP_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_APP_ENTRY];
		}

		if (this.$fs.exists(path.resolve(this.projectDir, constants.SRC_DIR))) {
			return constants.SRC_DIR;
		} else {
			// legacy project setup often uses app folder
			return constants.APP_FOLDER_NAME;
		}
	}

	public getNsConfigRelativePath(): string {
		return constants.CONFIG_FILE_NAME_JS;
	}

	private resolveToProjectDir(
		pathToResolve: string,
		projectDir?: string,
	): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		if (!projectDir) {
			return null;
		}

		return path.resolve(projectDir, pathToResolve);
	}

	@cache()
	private initializeProjectIdentifiers(
		config: INsConfig,
	): Mobile.IProjectIdentifier {
		this.$logger.trace(`Initializing project identifiers. Config: `, config);

		if (!config) {
			this.$logger.error("Unable to determine app id.");
			return {
				ios: "",
				android: "",
				visionos: "",
			};
		}

		const identifier: Mobile.IProjectIdentifier = {
			ios: config.id,
			android: config.id,
			visionos: config.id,
		};

		if (config.ios && config.ios.id) {
			identifier.ios = config.ios.id;
		}
		if (config.android && config.android.id) {
			identifier.android = config.android.id;
		}
		if (config.visionos && config.visionos.id) {
			identifier.visionos = config.visionos.id;
		}

		return identifier;
	}

	private getProjectType(): string {
		let detectedProjectType = _.find(
			ProjectData.PROJECT_TYPES,
			(projectType) => projectType.isDefaultProjectType,
		).type;

		const deps: string[] = _.keys(this.dependencies).concat(
			_.keys(this.devDependencies),
		);

		_.each(ProjectData.PROJECT_TYPES, (projectType) => {
			if (
				_.some(
					projectType.requiredDependencies,
					(requiredDependency) => deps.indexOf(requiredDependency) !== -1,
				)
			) {
				detectedProjectType = projectType.type;
				return false;
			}
		});

		return detectedProjectType;
	}

	@cache()
	private warnProjectId(): void {
		this.$logger.warn(
			"[WARNING]: IProjectData.projectId is deprecated. Please use IProjectData.projectIdentifiers[platform].",
		);
	}
}

injector.register("projectData", ProjectData, true);
