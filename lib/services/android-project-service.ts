import * as path from "path";
import * as shell from "shelljs";
import * as _ from "lodash";
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { DeviceAndroidDebugBridge } from "../common/mobile/android/device-android-debug-bridge";
import { Configurations, LiveSyncPaths } from "../common/constants";
import { hook } from "../common/helpers";
import { performanceLog } from ".././common/decorators";
import {
	IProjectData,
	IProjectDataService,
	IValidatePlatformOutput,
} from "../definitions/project";
import {
	IPlatformData,
	IBuildOutputOptions,
	IPlatformEnvironmentRequirements,
	IValidBuildOutputData,
} from "../definitions/platform";
import {
	IAndroidToolsInfo,
	IAndroidResourcesMigrationService,
	IOptions,
	IDependencyData,
} from "../declarations";
import { IAndroidBuildData } from "../definitions/build";
import { IPluginData } from "../definitions/plugins";
import {
	IErrors,
	IFileSystem,
	IAnalyticsService,
	IDictionary,
	IRelease,
	ISpawnResult,
} from "../common/declarations";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
} from "../definitions/android-plugin-migrator";
import { IFilesHashService } from "../definitions/files-hash-service";
import {
	IGradleCommandService,
	IGradleBuildService,
} from "../definitions/gradle";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { INotConfiguredEnvOptions } from "../common/definitions/commands";
import { IProjectChangesInfo } from "../definitions/project-changes";
import { AndroidPrepareData } from "../data/prepare-data";
import { AndroidBuildData } from "../data/build-data";

interface NativeDependency {
	name: string;
	directory: string;
	dependencies: string[];
}

//
// we sort the native dependencies topologically to make sure they are processed in the right order
// native dependenciess need to be sorted so the deepst dependencies are built before it's parents
//
// for example, given this dep structure (assuming these are all native dependencies that need to be built)
// (note: we list all dependencies at the root level, so the leaf nodes are essentially references to the root nodes)
//
//   |- dep1
//   |- dep2
//   |- |- dep3
//   |- |- dep4
//   |- |- |- dep5
//   |- dep3
//   |- dep4
//   |- |- dep5
//   |- dep5
//
// It is sorted:
//
//   |- dep1
//   |- dep3
//   |- dep5
//   |- dep4        # depends on dep5, so dep5 must be built first, ie above ^
//   |- |- dep5
//   |- dep2        # depends on dep3, dep4 (and dep5 through dep4) so all of them must be built first before dep2 is built
//   |- |- dep3
//   |- |- dep4
//   |- |- |- dep5
//
// for more details see: https://wikiless.org/wiki/Topological_sorting?lang=en
//
function topologicalSortNativeDependencies(
	dependencies: NativeDependency[],
	start: NativeDependency[] = [],
	depth = 0,
	total = 0 // do not pass in, we calculate it in the initial run!
): NativeDependency[] {
	// we set the total on the initial call - and never increment it, as it's used for esacaping the recursion
	if (total === 0) {
		total = dependencies.length;
	}

	const sortedDeps = dependencies.reduce(
		(sortedDeps, currentDependency: NativeDependency) => {
			const allSubDependenciesProcessed = currentDependency.dependencies.every(
				(subDependency) => {
					return sortedDeps.some((dep) => dep.name === subDependency);
				}
			);
			if (allSubDependenciesProcessed) {
				sortedDeps.push(currentDependency);
			}
			return sortedDeps;
		},
		start
	);

	const remainingDeps = dependencies.filter(
		(nativeDep) => !sortedDeps.includes(nativeDep)
	);

	// recurse if we still have remaining deps
	// the second condition here prevents infinite recursion
	if (remainingDeps.length && sortedDeps.length < total) {
		return topologicalSortNativeDependencies(
			remainingDeps,
			sortedDeps,
			depth + 1,
			total
		);
	}

	return sortedDeps;
}

export class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase {
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX =
		AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.5.0";

	constructor(
		private $androidToolsInfo: IAndroidToolsInfo,
		private $errors: IErrors,
		$fs: IFileSystem,
		private $logger: ILogger,
		$projectDataService: IProjectDataService,
		private $options: IOptions,
		private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $androidPluginBuildService: IAndroidPluginBuildService,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $liveSyncProcessDataService: ILiveSyncProcessDataService,
		private $devicesService: Mobile.IDevicesService,
		private $filesHashService: IFilesHashService,
		private $gradleCommandService: IGradleCommandService,
		private $gradleBuildService: IGradleBuildService,
		private $analyticsService: IAnalyticsService
	) {
		super($fs, $projectDataService);
	}

	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error(
				"First call of getPlatformData without providing projectData."
			);
		}
		if (projectData && projectData.platformsDir) {
			const projectRoot = this.$options.hostProjectPath
				? this.$options.hostProjectPath
				: path.join(
						projectData.platformsDir,
						AndroidProjectService.ANDROID_PLATFORM_NAME
				  );

			const appDestinationDirectoryArr = [
				projectRoot,
				this.$options.hostProjectModuleName,
				constants.SRC_DIR,
				constants.MAIN_DIR,
				constants.ASSETS_DIR,
			];
			const configurationsDirectoryArr = [
				projectRoot,
				this.$options.hostProjectModuleName,
				constants.SRC_DIR,
				constants.MAIN_DIR,
				constants.MANIFEST_FILE_NAME,
			];
			const deviceBuildOutputArr = [
				projectRoot,
				this.$options.hostProjectModuleName,
				constants.BUILD_DIR,
				constants.OUTPUTS_DIR,
				constants.APK_DIR,
			];

			const packageName = this.getProjectNameFromId(projectData);
			const runtimePackage = this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				constants.PlatformTypes.android
			);

			this._platformData = {
				frameworkPackageName: runtimePackage.name,
				normalizedPlatformName: "Android",
				platformNameLowerCase: "android",
				appDestinationDirectoryPath: path.join(...appDestinationDirectoryArr),
				platformProjectService: <any>this,
				projectRoot: projectRoot,
				getBuildOutputPath: (buildOptions: IBuildOutputOptions) => {
					if (buildOptions.androidBundle) {
						return path.join(
							projectRoot,
							this.$options.hostProjectModuleName,
							constants.BUILD_DIR,
							constants.OUTPUTS_DIR,
							constants.BUNDLE_DIR
						);
					}

					return path.join(...deviceBuildOutputArr);
				},
				getValidBuildOutputData: (
					buildOptions: IBuildOutputOptions
				): IValidBuildOutputData => {
					const buildMode = buildOptions.release
						? Configurations.Release.toLowerCase()
						: Configurations.Debug.toLowerCase();

					if (buildOptions.androidBundle) {
						return {
							packageNames: [
								`${this.$options.hostProjectModuleName}${constants.AAB_EXTENSION_NAME}`,
								`${this.$options.hostProjectModuleName}-${buildMode}${constants.AAB_EXTENSION_NAME}`,
							],
						};
					}

					return {
						packageNames: [
							`${packageName}-${buildMode}${constants.APK_EXTENSION_NAME}`,
							`${projectData.projectName}-${buildMode}${constants.APK_EXTENSION_NAME}`,
							`${projectData.projectName}${constants.APK_EXTENSION_NAME}`,
							`${this.$options.hostProjectModuleName}-${buildMode}${constants.APK_EXTENSION_NAME}`,
						],
						regexes: [
							new RegExp(
								`(${packageName}|${this.$options.hostProjectModuleName})-.*-(${Configurations.Debug}|${Configurations.Release})(-unsigned)?${constants.APK_EXTENSION_NAME}`,
								"i"
							),
						],
					};
				},
				configurationFileName: constants.MANIFEST_FILE_NAME,
				configurationFilePath: path.join(...configurationsDirectoryArr),
				relativeToFrameworkConfigurationFilePath: path.join(
					constants.SRC_DIR,
					constants.MAIN_DIR,
					constants.MANIFEST_FILE_NAME
				),
				fastLivesyncFileExtensions: [".jpg", ".gif", ".png", ".bmp", ".webp"], // http://developer.android.com/guide/appendix/media-formats.html
			};
		}

		return this._platformData;
	}

	public getCurrentPlatformVersion(
		platformData: IPlatformData,
		projectData: IProjectData
	): string {
		const currentPlatformData: IDictionary<any> =
			this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				<constants.PlatformTypes>platformData.platformNameLowerCase
			);

		return currentPlatformData && currentPlatformData[constants.VERSION_STRING];
	}

	public async validateOptions(): Promise<boolean> {
		return true;
	}

	public getAppResourcesDestinationDirectoryPath(
		projectData: IProjectData
	): string {
		const appResourcesDirStructureHasMigrated =
			this.$androidResourcesMigrationService.hasMigrated(
				projectData.getAppResourcesDirectoryPath()
			);

		if (appResourcesDirStructureHasMigrated) {
			return this.getUpdatedAppResourcesDestinationDirPath(projectData);
		} else {
			return this.getLegacyAppResourcesDestinationDirPath(projectData);
		}
	}

	public async validate(
		projectData: IProjectData,
		options: IOptions,
		notConfiguredEnvOptions?: INotConfiguredEnvOptions
	): Promise<IValidatePlatformOutput> {
		this.validatePackageName(projectData.projectIdentifiers.android);
		this.validateProjectName(projectData.projectName);

		const checkEnvironmentRequirementsOutput =
			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
				platform: this.getPlatformData(projectData).normalizedPlatformName,
				projectDir: projectData.projectDir,
				options,
				notConfiguredEnvOptions,
			});

		this.$androidToolsInfo.validateInfo({
			showWarningsAsErrors: true,
			projectDir: projectData.projectDir,
			validateTargetSdk: true,
		});

		return {
			checkEnvironmentRequirementsOutput,
		};
	}

	public async createProject(
		frameworkDir: string,
		frameworkVersion: string,
		projectData: IProjectData
	): Promise<void> {
		if (
			semver.lt(
				frameworkVersion,
				AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE
			)
		) {
			this.$errors.fail(
				`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`
			);
		}

		this.$fs.ensureDirectoryExists(
			this.getPlatformData(projectData).projectRoot
		);
		const androidToolsInfo = this.$androidToolsInfo.getToolsInfo({
			projectDir: projectData.projectDir,
		});
		const targetSdkVersion =
			androidToolsInfo && androidToolsInfo.targetSdkVersion;
		this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);

		this.copy(
			this.getPlatformData(projectData).projectRoot,
			frameworkDir,
			"*",
			"-R"
		);
		if (this.$options.overrideRuntimeGradleFiles !== false) {
			// override app build.gradle from cli vendor to allow updates faster than the runtime
			const gradleTemplatePath = path.resolve(
				path.join(__dirname, "../../vendor/gradle-app")
			);
			const allGradleTemplateFiles = path.join(gradleTemplatePath, "*");
	
			this.$fs.copyFile(allGradleTemplateFiles, path.join(this.getPlatformData(projectData).projectRoot));
		}
		// TODO: Check if we actually need this and if it should be targetSdk or compileSdk
		this.cleanResValues(targetSdkVersion, projectData);
	}

	private getResDestinationDir(projectData: IProjectData): string {
		const appResourcesDirStructureHasMigrated =
			this.$androidResourcesMigrationService.hasMigrated(
				projectData.getAppResourcesDirectoryPath()
			);

		if (appResourcesDirStructureHasMigrated) {
			const appResourcesDestinationPath =
				this.getUpdatedAppResourcesDestinationDirPath(projectData);
			return path.join(
				appResourcesDestinationPath,
				constants.MAIN_DIR,
				constants.RESOURCES_DIR
			);
		} else {
			return this.getLegacyAppResourcesDestinationDirPath(projectData);
		}
	}

	private cleanResValues(
		targetSdkVersion: number,
		projectData: IProjectData
	): void {
		const resDestinationDir = this.getResDestinationDir(projectData);
		const directoriesInResFolder = this.$fs.readDirectory(resDestinationDir);
		const directoriesToClean = directoriesInResFolder
			.map((dir) => {
				return {
					dirName: dir,
					sdkNum: parseInt(
						dir.substr(
							AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX.length
						)
					),
				};
			})
			.filter(
				(dir) =>
					dir.dirName.match(
						AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX
					) &&
					dir.sdkNum &&
					(!targetSdkVersion || targetSdkVersion < dir.sdkNum)
			)
			.map((dir) => path.join(resDestinationDir, dir.dirName));

		this.$logger.trace("Directories to clean:");

		this.$logger.trace(directoriesToClean);

		_.map(directoriesToClean, (dir) => this.$fs.deleteDirectory(dir));
	}

	public async interpolateData(projectData: IProjectData): Promise<void> {
		// Interpolate the apilevel and package
		this.interpolateConfigurationFile(projectData);
		const appResourcesDirectoryPath =
			projectData.getAppResourcesDirectoryPath();

		let stringsFilePath: string;

		const appResourcesDestinationDirectoryPath =
			this.getAppResourcesDestinationDirectoryPath(projectData);
		if (
			this.$androidResourcesMigrationService.hasMigrated(
				appResourcesDirectoryPath
			)
		) {
			stringsFilePath = path.join(
				appResourcesDestinationDirectoryPath,
				constants.MAIN_DIR,
				constants.RESOURCES_DIR,
				"values",
				"strings.xml"
			);
		} else {
			stringsFilePath = path.join(
				appResourcesDestinationDirectoryPath,
				"values",
				"strings.xml"
			);
		}

		shell.sed("-i", /__NAME__/, projectData.projectName, stringsFilePath);
		shell.sed(
			"-i",
			/__TITLE_ACTIVITY__/,
			projectData.projectName,
			stringsFilePath
		);

		const gradleSettingsFilePath = path.join(
			this.getPlatformData(projectData).projectRoot,
			"settings.gradle"
		);
		const relativePath = path.relative(
			this.getPlatformData(projectData).projectRoot,
			projectData.projectDir
		);
		shell.sed(
			"-i",
			/def USER_PROJECT_ROOT = \"\$rootDir\/..\/..\/\"/,
			`def USER_PROJECT_ROOT = "$rootDir/${relativePath}"`,
			gradleSettingsFilePath
		);

		shell.sed(
			"-i",
			/__PROJECT_NAME__/,
			this.getProjectNameFromId(projectData),
			gradleSettingsFilePath
		);

		const gradleVersion = projectData.nsConfig.android.gradleVersion;
		if (gradleVersion) {
			// user defined a custom gradle version, let's apply it
			const gradleWrapperFilePath = path.join(
				this.getPlatformData(projectData).projectRoot,
				"gradle",
				"wrapper",
				"gradle-wrapper.properties"
			);
			shell.sed(
				"-i",
				/gradle-([0-9.]+)-bin.zip/,
				`gradle-${gradleVersion}-bin.zip`,
				gradleWrapperFilePath
			);
		}

		try {
			// will replace applicationId in app/App_Resources/Android/app.gradle if it has not been edited by the user
			const appGradleContent = this.$fs.readText(projectData.appGradlePath);
			if (appGradleContent.indexOf(constants.PACKAGE_PLACEHOLDER_NAME) !== -1) {
				//TODO: For compatibility with old templates. Once all templates are updated should delete.
				shell.sed(
					"-i",
					new RegExp(constants.PACKAGE_PLACEHOLDER_NAME),
					projectData.projectIdentifiers.android,
					projectData.appGradlePath
				);
			}
		} catch (e) {
			this.$logger.trace(
				`Templates updated and no need for replace in app.gradle.`
			);
		}
	}

	public interpolateConfigurationFile(projectData: IProjectData): void {
		const manifestPath =
			this.getPlatformData(projectData).configurationFilePath;
		shell.sed(
			"-i",
			/__PACKAGE__/,
			projectData.projectIdentifiers.android,
			manifestPath
		);
		const buildAppGradlePath = path.join(
			this.getPlatformData(projectData).projectRoot,
			"app",
			"build.gradle"
		);
		const buildGradlePath = path.join(
			this.getPlatformData(projectData).projectRoot,
			"build.gradle"
		);
		shell.sed(
			"-i",
			/__PACKAGE__/,
			projectData.projectIdentifiers.android,
			buildAppGradlePath
		);
		const relativePath = path.relative(
			this.getPlatformData(projectData).projectRoot,
			projectData.projectDir
		);
		shell.sed(
			"-i",
			/project.ext.USER_PROJECT_ROOT = \"\$rootDir\/..\/..\"/,
			`project.ext.USER_PROJECT_ROOT = "$rootDir/${relativePath}"`,
			buildGradlePath
		);
	}

	private getProjectNameFromId(projectData: IProjectData): string {
		let id: string;
		if (
			projectData &&
			projectData.projectIdentifiers &&
			projectData.projectIdentifiers.android
		) {
			const idParts = projectData.projectIdentifiers.android.split(".");
			id = idParts[idParts.length - 1];
		}

		return id;
	}

	public afterCreateProject(projectRoot: string): void {
		return null;
	}

	public async updatePlatform(
		currentVersion: string,
		newVersion: string,
		canUpdate: boolean,
		projectData: IProjectData,
		addPlatform?: Function,
		removePlatforms?: (platforms: string[]) => Promise<void>
	): Promise<boolean> {
		if (
			semver.eq(
				newVersion,
				AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE
			)
		) {
			const platformLowercase =
				this.getPlatformData(projectData).normalizedPlatformName.toLowerCase();
			await removePlatforms([platformLowercase.split("@")[0]]);
			await addPlatform(platformLowercase);
			return false;
		}

		return true;
	}

	@performanceLog()
	@hook("buildAndroid")
	public async buildProject(
		projectRoot: string,
		projectData: IProjectData,
		buildData: IAndroidBuildData
	): Promise<void> {
		const platformData = this.getPlatformData(projectData);
		await this.$gradleBuildService.buildProject(
			platformData.projectRoot,
			buildData
		);

		const outputPath = platformData.getBuildOutputPath(buildData);
		await this.$filesHashService.saveHashesForProject(
			this._platformData,
			outputPath
		);
		await this.trackKotlinUsage(projectRoot);
	}

	public async buildForDeploy(
		projectRoot: string,
		projectData: IProjectData,
		buildData?: IAndroidBuildData
	): Promise<void> {
		return this.buildProject(projectRoot, projectData, buildData);
	}

	public isPlatformPrepared(
		projectRoot: string,
		projectData: IProjectData
	): boolean {
		return this.$fs.exists(
			path.join(
				this.getPlatformData(projectData).appDestinationDirectoryPath,
				this.$options.hostProjectModuleName
			)
		);
	}

	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}

	public async prepareProject(): Promise<void> {
		// Intentionally left empty.
	}

	public ensureConfigurationFileInAppResources(
		projectData: IProjectData
	): void {
		const appResourcesDirectoryPath = projectData.appResourcesDirectoryPath;
		const appResourcesDirStructureHasMigrated =
			this.$androidResourcesMigrationService.hasMigrated(
				appResourcesDirectoryPath
			);
		let originalAndroidManifestFilePath;

		if (appResourcesDirStructureHasMigrated) {
			originalAndroidManifestFilePath = path.join(
				appResourcesDirectoryPath,
				this.$devicePlatformsConstants.Android,
				"src",
				"main",
				this.getPlatformData(projectData).configurationFileName
			);
		} else {
			originalAndroidManifestFilePath = path.join(
				appResourcesDirectoryPath,
				this.$devicePlatformsConstants.Android,
				this.getPlatformData(projectData).configurationFileName
			);
		}

		const manifestExists = this.$fs.exists(originalAndroidManifestFilePath);

		if (!manifestExists) {
			this.$logger.warn(
				"No manifest found in " + originalAndroidManifestFilePath
			);
			return;
		}
		// Overwrite the AndroidManifest from runtime.
		if (!appResourcesDirStructureHasMigrated) {
			this.$fs.copyFile(
				originalAndroidManifestFilePath,
				this.getPlatformData(projectData).configurationFilePath
			);
		}
	}

	public prepareAppResources(projectData: IProjectData): void {
		const platformData = this.getPlatformData(projectData);
		const projectAppResourcesPath = projectData.getAppResourcesDirectoryPath(
			projectData.projectDir
		);
		const platformsAppResourcesPath =
			this.getAppResourcesDestinationDirectoryPath(projectData);

		this.cleanUpPreparedResources(projectData);

		this.$fs.ensureDirectoryExists(platformsAppResourcesPath);

		const appResourcesDirStructureHasMigrated =
			this.$androidResourcesMigrationService.hasMigrated(
				projectAppResourcesPath
			);
		if (appResourcesDirStructureHasMigrated) {
			const resourcesPath = path.join(
				projectAppResourcesPath,
				platformData.normalizedPlatformName
			);
			this.$fs.copyFile(
				path.join(resourcesPath, constants.SRC_DIR, "*"),
				platformsAppResourcesPath
			);

			const destinationFolder = this.getPlatformData(projectData).projectRoot;
			const contents = this.$fs.readDirectory(resourcesPath);
			_.each(contents, (fileName) => {
				const filePath = path.join(resourcesPath, fileName);
				const fsStat = this.$fs.getFsStats(filePath);
				if (fsStat.isDirectory() && fileName !== constants.SRC_DIR) {
					console.log("copying folder", filePath);
					this.$fs.copyFile(filePath, destinationFolder);
				}
			});
		} else {
			this.$fs.copyFile(
				path.join(
					projectAppResourcesPath,
					platformData.normalizedPlatformName,
					"*"
				),
				platformsAppResourcesPath
			);
			// https://github.com/NativeScript/android-runtime/issues/899
			// App_Resources/Android/libs is reserved to user's aars and jars, but they should not be copied as resources
			this.$fs.deleteDirectory(path.join(platformsAppResourcesPath, "libs"));
		}

		const androidToolsInfo = this.$androidToolsInfo.getToolsInfo({
			projectDir: projectData.projectDir,
		});
		const compileSdkVersion =
			androidToolsInfo && androidToolsInfo.compileSdkVersion;
		this.cleanResValues(compileSdkVersion, projectData);
	}

	public async preparePluginNativeCode(
		pluginData: IPluginData,
		projectData: IProjectData
	): Promise<void> {
		// build Android plugins which contain AndroidManifest.xml and/or resources
		const pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(
			pluginData,
			AndroidProjectService.ANDROID_PLATFORM_NAME
		);
		if (this.$fs.exists(pluginPlatformsFolderPath)) {
			const gradleArgs = (projectData.nsConfig.android.gradleArgs || []).concat(this.$options.gradleArgs || []);
			const pluginOptions = (projectData.nsConfig.android.plugins || {})[pluginData.name] || {};
			const options: IPluginBuildOptions = {
				gradlePath: this.$options.gradlePath,
				gradleArgs,
				projectDir: projectData.projectDir,
				pluginName: pluginData.name,
				platformsAndroidDirPath: pluginPlatformsFolderPath,
				aarOutputDir: pluginPlatformsFolderPath,
				tempPluginDirPath: path.join(projectData.platformsDir, "tempPlugin"),
				...pluginOptions
			};

			if (await this.$androidPluginBuildService.buildAar(options)) {
				this.$logger.info(`Built aar for ${options.pluginName}`);
			}

			this.$androidPluginBuildService.migrateIncludeGradle(options);
		}
	}

	public async processConfigurationFilesFromAppResources(): Promise<void> {
		return;
	}

	public async removePluginNativeCode(
		pluginData: IPluginData,
		projectData: IProjectData
	): Promise<void> {
		// not implemented
	}

	public async beforePrepareAllPlugins(
		projectData: IProjectData,
		dependencies?: IDependencyData[]
	): Promise<IDependencyData[]> {
		if (dependencies) {
			dependencies = this.filterUniqueDependencies(dependencies);
			return this.provideDependenciesJson(projectData, dependencies);
		}
	}

	public async handleNativeDependenciesChange(
		projectData: IProjectData,
		opts: IRelease
	): Promise<void> {
		return;
	}

	private filterUniqueDependencies(
		dependencies: IDependencyData[]
	): IDependencyData[] {
		const depsDictionary = dependencies.reduce((dict, dep) => {
			const collision = dict[dep.name];
			// in case there are multiple dependencies to the same module, the one declared in the package.json takes precedence
			if (!collision || collision.depth > dep.depth) {
				dict[dep.name] = dep;
			}
			return dict;
		}, <IDictionary<IDependencyData>>{});
		return _.values(depsDictionary);
	}

	private provideDependenciesJson(
		projectData: IProjectData,
		dependencies: IDependencyData[]
	): IDependencyData[] {
		const platformDir = this.$options.hostProjectPath
			? this.$options.hostProjectPath
			: path.join(
					projectData.platformsDir,
					AndroidProjectService.ANDROID_PLATFORM_NAME
			  );
		const dependenciesJsonPath = path.join(
			platformDir,
			constants.DEPENDENCIES_JSON_NAME
		);
		let nativeDependencyData = dependencies.filter(
			AndroidProjectService.isNativeAndroidDependency
		);

		let nativeDependencies = nativeDependencyData.map(
			({ name, directory, dependencies }) => {
				return {
					name,
					directory: path.relative(platformDir, directory),
					dependencies: dependencies.filter((dep) => {
						// filter out transient dependencies that don't have native dependencies
						return (
							nativeDependencyData.findIndex(
								(nativeDep) => nativeDep.name === dep
							) !== -1
						);
					}),
				} as NativeDependency;
			}
		);
		nativeDependencies = topologicalSortNativeDependencies(nativeDependencies);
		const jsonContent = JSON.stringify(nativeDependencies, null, 4);
		this.$fs.writeFile(dependenciesJsonPath, jsonContent);

		// we sort all the dependencies to respect the topological sorting of the native dependencies
		return dependencies.sort(function (a, b) {
			return (
				nativeDependencies.findIndex((n) => n.name === a.name) -
				nativeDependencies.findIndex((n) => n.name === b.name)
			);
		});
	}

	private static isNativeAndroidDependency({
		nativescript,
	}: IDependencyData): boolean {
		return (
			nativescript &&
			(nativescript.android ||
				(nativescript.platforms && nativescript.platforms.android))
		);
	}

	public async stopServices(projectRoot: string): Promise<ISpawnResult> {
		const result = await this.$gradleCommandService.executeCommand(
			["--stop", "--quiet"],
			{
				cwd: projectRoot,
				message: "Gradle stop services...",
				stdio: "pipe",
			}
		);

		return result;
	}

	public async cleanProject(projectRoot: string): Promise<void> {
		await this.$gradleBuildService.cleanProject(projectRoot, <any>{
			release: false,
		});
	}

	public async cleanDeviceTempFolder(
		deviceIdentifier: string,
		projectData: IProjectData
	): Promise<void> {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, {
			identifier: deviceIdentifier,
		});
		const deviceRootPath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${projectData.projectIdentifiers.android}`;
		await adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
	}

	public async checkForChanges(
		changesInfo: IProjectChangesInfo,
		prepareData: AndroidPrepareData,
		projectData: IProjectData
	): Promise<void> {
		//we need to check for abi change in connected device vs last built
		const deviceDescriptors =
			this.$liveSyncProcessDataService.getDeviceDescriptors(
				projectData.projectDir
			);
		const platformData = this.getPlatformData(projectData);
		deviceDescriptors.forEach((deviceDescriptor) => {
			const buildData = deviceDescriptor.buildData as AndroidBuildData;
			if (buildData.buildFilterDevicesArch) {
				const outputPath = platformData.getBuildOutputPath(
					deviceDescriptor.buildData
				);
				const apkOutputPath = path.join(
					outputPath,
					prepareData.release ? "release" : "debug"
				);
				if (!this.$fs.exists(apkOutputPath)) {
					return;
				}
				// check if we already build this arch
				// if not we need to say native has changed

				const directoryContent = this.$fs.readDirectory(apkOutputPath);
				// if we are building for universal we should not check for missing abi apks
				if (!directoryContent.find(f=>f.indexOf("universal") !== -1)) {
					const device = this.$devicesService
						.getDevicesForPlatform(deviceDescriptor.buildData.platform)
						.filter(
							(d) => d.deviceInfo.identifier === deviceDescriptor.identifier
						)[0];
					const abis = device.deviceInfo.abis.filter((a) => !!a && a.length)[0];
					const regexp = new RegExp(`${abis}.*\.apk`);
					const files = _.filter(directoryContent, (entry: string) => {
						return regexp.test(entry);
					});
					if (files.length === 0) {
						changesInfo.nativeChanged = true;
					}
				}
				
			}
		});
	}

	public getDeploymentTarget(projectData: IProjectData): semver.SemVer {
		return;
	}

	private copy(
		projectRoot: string,
		frameworkDir: string,
		files: string,
		cpArg: string
	): void {
		const paths = files.split(" ").map((p) => path.join(frameworkDir, p));
		shell.cp(cpArg, paths, projectRoot);
	}

	private validatePackageName(packageName: string): void {
		//Make the package conform to Java package types
		//Enforce underscore limitation
		if (!/^[a-zA-Z]+(\.[a-zA-Z0-9][a-zA-Z0-9_]*)+$/.test(packageName)) {
			this.$errors.fail(
				`Package name must look like: com.company.Name. Got: ${packageName}`
			);
		}

		//Class is a reserved word
		if (/\b[Cc]lass\b/.test(packageName)) {
			this.$errors.fail("class is a reserved word");
		}
	}

	private validateProjectName(projectName: string): void {
		if (projectName === "") {
			this.$errors.fail("Project name cannot be empty");
		}

		//Classes in Java don't begin with numbers
		if (/^[0-9]/.test(projectName)) {
			this.$errors.fail("Project name must not begin with a number");
		}
	}

	private getLegacyAppResourcesDestinationDirPath(
		projectData: IProjectData
	): string {
		const resourcePath: string[] = [
			this.$options.hostProjectModuleName,
			constants.SRC_DIR,
			constants.MAIN_DIR,
			constants.RESOURCES_DIR,
		];

		return path.join(
			this.getPlatformData(projectData).projectRoot,
			...resourcePath
		);
	}

	private getUpdatedAppResourcesDestinationDirPath(
		projectData: IProjectData
	): string {
		const resourcePath: string[] = [
			this.$options.hostProjectModuleName,
			constants.SRC_DIR,
		];

		return path.join(
			this.getPlatformData(projectData).projectRoot,
			...resourcePath
		);
	}

	/**
	 * The purpose of this method is to delete the previously prepared user resources.
	 * The content of the `<platforms>/android/.../res` directory is based on user's resources and gradle project template from android-runtime.
	 * During preparation of the `<path to user's App_Resources>/Android` we want to clean all the users files from previous preparation,
	 * but keep the ones that were introduced during `platform add` of the android-runtime.
	 * Currently the Gradle project template contains resources only in values and values-v21 directories.
	 * So the current logic of the method is cleaning al resources from `<platforms>/android/.../res` that are not in `values.*` directories
	 * and that exist in the `<path to user's App_Resources>/Android/.../res` directory
	 * This means that if user has a resource file in values-v29 for example, builds the project and then deletes this resource,
	 * it will be kept in platforms directory. Reference issue: `https://github.com/NativeScript/nativescript-cli/issues/5083`
	 * Same is valid for files in `drawable-<resolution>` directories - in case in user's resources there's drawable-hdpi directory,
	 * which is deleted after the first build of app, it will remain in platforms directory.
	 */
	private cleanUpPreparedResources(projectData: IProjectData): void {
		let resourcesDirPath = path.join(
			projectData.appResourcesDirectoryPath,
			this.getPlatformData(projectData).normalizedPlatformName
		);
		if (
			this.$androidResourcesMigrationService.hasMigrated(
				projectData.appResourcesDirectoryPath
			)
		) {
			resourcesDirPath = path.join(
				resourcesDirPath,
				constants.SRC_DIR,
				constants.MAIN_DIR,
				constants.RESOURCES_DIR
			);
		}

		const valuesDirRegExp = /^values/;
		if (this.$fs.exists(resourcesDirPath)) {
			const resourcesDirs = this.$fs
				.readDirectory(resourcesDirPath)
				.filter((resDir) => !resDir.match(valuesDirRegExp));
			const resDestinationDir = this.getResDestinationDir(projectData);
			_.each(resourcesDirs, (currentResource) => {
				this.$fs.deleteDirectory(path.join(resDestinationDir, currentResource));
			});
		}
	}

	private async trackKotlinUsage(projectRoot: string): Promise<void> {
		const buildStatistics = this.tryGetAndroidBuildStatistics(projectRoot);

		try {
			if (buildStatistics && buildStatistics.kotlinUsage) {
				const analyticsDelimiter = constants.AnalyticsEventLabelDelimiter;
				const hasUseKotlinPropertyInAppData = `hasUseKotlinPropertyInApp${analyticsDelimiter}${buildStatistics.kotlinUsage.hasUseKotlinPropertyInApp}`;
				const hasKotlinRuntimeClassesData = `hasKotlinRuntimeClasses${analyticsDelimiter}${buildStatistics.kotlinUsage.hasKotlinRuntimeClasses}`;
				await this.$analyticsService.trackEventActionInGoogleAnalytics({
					action: constants.TrackActionNames.UsingKotlin,
					additionalData: `${hasUseKotlinPropertyInAppData}${analyticsDelimiter}${hasKotlinRuntimeClassesData}`,
				});
			}
		} catch (e) {
			this.$logger.trace(
				`Failed to track android build statistics. Error is: ${e.message}`
			);
		}
	}

	private tryGetAndroidBuildStatistics(projectRoot: string): any {
		const staticsFilePath = path.join(
			projectRoot,
			constants.ANDROID_ANALYTICS_DATA_DIR,
			constants.ANDROID_ANALYTICS_DATA_FILE
		);
		let buildStatistics;

		if (this.$fs.exists(staticsFilePath)) {
			try {
				buildStatistics = this.$fs.readJson(staticsFilePath);
			} catch (e) {
				this.$logger.trace(
					`Unable to read android build statistics file. Error is ${e.message}`
				);
			}
		}

		return buildStatistics;
	}
}

injector.register("androidProjectService", AndroidProjectService);
