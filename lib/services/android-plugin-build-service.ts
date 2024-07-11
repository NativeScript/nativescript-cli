import * as path from "path";
import {
	MANIFEST_FILE_NAME,
	INCLUDE_GRADLE_NAME,
	ASSETS_DIR,
	RESOURCES_DIR,
	AndroidBuildDefaults,
	PLUGIN_BUILD_DATA_FILENAME,
	SCOPED_ANDROID_RUNTIME_NAME,
} from "../constants";
import { getShortPluginName, hook } from "../common/helpers";
import { Builder, parseString } from "xml2js";
import {
	IRuntimeGradleVersions,
	INodePackageManager,
	IWatchIgnoreListService,
	IOptions,
} from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IProjectData, IProjectDataService } from "../definitions/project";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
	IBuildAndroidPluginData,
} from "../definitions/android-plugin-migrator";
import {
	IFileSystem,
	IChildProcess,
	IHostInfo,
	IErrors,
	IHooksService,
	IFsStats,
	IStringDictionary,
} from "../common/declarations";
import { IFilesHashService } from "../definitions/files-hash-service";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import * as _ from "lodash";
import { resolvePackageJSONPath } from "@rigor789/resolve-package-path";
import { cwd } from "process";

export class AndroidPluginBuildService implements IAndroidPluginBuildService {
	private get $platformsDataService(): IPlatformsDataService {
		return this.$injector.resolve("platformsDataService");
	}

	constructor(
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $options: IOptions,
		private $logger: ILogger,
		private $packageManager: INodePackageManager,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $filesHashService: IFilesHashService,
		public $hooksService: IHooksService,
		private $injector: IInjector,
		private $watchIgnoreListService: IWatchIgnoreListService
	) {}

	private static MANIFEST_ROOT = {
		$: {
			"xmlns:android": "http://schemas.android.com/apk/res/android",
		},
	};

	private getAndroidSourceDirectories(source: string): Array<string> {
		const directories = [RESOURCES_DIR, "java", ASSETS_DIR, "jniLibs", "cpp"];
		const resultArr: Array<string> = [];

		this.$fs.enumerateFilesInDirectorySync(source, (file, stat) => {
			if (
				stat.isDirectory() &&
				_.some(directories, (element) => file.endsWith(element))
			) {
				resultArr.push(file);
				return true;
			}
		});

		return resultArr;
	}

	private getManifest(platformsDir: string): string {
		const manifest = path.join(platformsDir, MANIFEST_FILE_NAME);
		return this.$fs.exists(manifest) ? manifest : null;
	}

	private async updateManifestContent(
		oldManifestContent: string,
		defaultPackageName: string
	): Promise<string> {
		let xml: any = await this.getXml(oldManifestContent);

		let packageName = defaultPackageName;
		// if the manifest file is full-featured and declares settings inside the manifest scope
		if (xml["manifest"]) {
			if (xml["manifest"]["$"]["package"]) {
				packageName = xml["manifest"]["$"]["package"];
			}

			// set the xml as the value to iterate over its properties
			xml = xml["manifest"];
		}

		// if the manifest file doesn't have a <manifest> scope, only the first setting will be picked up
		const newManifest: any = { manifest: {} };
		for (const prop in xml) {
			newManifest.manifest[prop] = xml[prop];
		}

		newManifest.manifest["$"]["package"] = packageName;

		const xmlBuilder = new Builder();
		const newManifestContent = xmlBuilder.buildObject(newManifest);

		return newManifestContent;
	}

	private createManifestContent(packageName: string): string {
		const newManifest: any = {
			manifest: AndroidPluginBuildService.MANIFEST_ROOT,
		};
		newManifest.manifest["$"]["package"] = packageName;
		const xmlBuilder: any = new Builder();
		const newManifestContent = xmlBuilder.buildObject(newManifest);

		return newManifestContent;
	}

	private async getXml(stringContent: string): Promise<any> {
		const promise = new Promise<any>((resolve, reject) =>
			parseString(stringContent, (err: any, result: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			})
		);

		return promise;
	}

	private getIncludeGradleCompileDependenciesScope(
		includeGradleFileContent: string
	): Array<string> {
		const indexOfDependenciesScope =
			includeGradleFileContent.indexOf("dependencies");
		const result: Array<string> = [];

		if (indexOfDependenciesScope === -1) {
			return result;
		}

		const indexOfRepositoriesScope =
			includeGradleFileContent.indexOf("repositories");

		let repositoriesScope = "";
		if (indexOfRepositoriesScope >= 0) {
			repositoriesScope = this.getScope(
				"repositories",
				includeGradleFileContent
			);
			result.push(repositoriesScope);
		}

		const dependenciesScope = this.getScope(
			"dependencies",
			includeGradleFileContent
		);
		result.push(dependenciesScope);

		return result;
	}

	private getScope(scopeName: string, content: string): string {
		const indexOfScopeName = content.indexOf(scopeName);
		const openingBracket = "{";
		const closingBracket = "}";
		let foundFirstBracket = false;
		let openBrackets = 0;
		let result = "";

		let i = indexOfScopeName;
		while (i !== -1 && i < content.length) {
			const currCharacter = content[i];
			if (currCharacter === openingBracket) {
				if (openBrackets === 0) {
					foundFirstBracket = true;
				}

				openBrackets++;
			}

			if (currCharacter === closingBracket) {
				openBrackets--;
			}

			result += currCharacter;

			if (openBrackets === 0 && foundFirstBracket) {
				break;
			}

			i++;
		}

		return result;
	}

	/**
	 * Returns whether the build has completed or not
	 * @param {Object} options
	 * @param {string} options.pluginName - The name of the plugin. E.g. 'nativescript-barcodescanner'
	 * @param {string} options.platformsAndroidDirPath - The path to the 'plugin/src/platforms/android' directory.
	 * @param {string} options.aarOutputDir - The path where the aar should be copied after a successful build.
	 * @param {string} options.tempPluginDirPath - The path where the android plugin will be built.
	 */
	public async buildAar(options: IPluginBuildOptions): Promise<boolean> {
		this.validateOptions(options);
		const manifestFilePath = this.getManifest(options.platformsAndroidDirPath);
		const androidSourceDirectories = this.getAndroidSourceDirectories(
			options.platformsAndroidDirPath
		);
		const shortPluginName = getShortPluginName(options.pluginName);
		const pluginTempDir = path.join(options.tempPluginDirPath, shortPluginName);
		const pluginSourceFileHashesInfo = await this.getSourceFilesHashes(
			options.platformsAndroidDirPath,
			shortPluginName
		);

		const shouldBuildAar = await this.shouldBuildAar({
			manifestFilePath,
			androidSourceDirectories,
			pluginTempDir,
			pluginSourceDir: options.platformsAndroidDirPath,
			shortPluginName,
			fileHashesInfo: pluginSourceFileHashesInfo,
		});

		if (shouldBuildAar) {
			this.cleanPluginDir(pluginTempDir);

			const pluginTempMainSrcDir = path.join(pluginTempDir, "src", "main");
			await this.updateManifest(
				manifestFilePath,
				pluginTempMainSrcDir,
				shortPluginName
			);
			this.copySourceSetDirectories(
				androidSourceDirectories,
				pluginTempMainSrcDir
			);
			await this.setupGradle(
				pluginTempDir,
				options.platformsAndroidDirPath,
				options.projectDir,
				options.pluginName
			);
			await this.buildPlugin({
				gradlePath: options.gradlePath,
				gradleArgs: options.gradleArgs,
				pluginDir: pluginTempDir,
				pluginName: options.pluginName,
				projectDir: options.projectDir,
			});
			this.$watchIgnoreListService.addFileToIgnoreList(
				path.join(options.aarOutputDir, `${shortPluginName}.aar`)
			);
			this.copyAar(shortPluginName, pluginTempDir, options.aarOutputDir);
			this.writePluginHashInfo(pluginSourceFileHashesInfo, pluginTempDir);
		}

		return shouldBuildAar;
	}

	private cleanPluginDir(pluginTempDir: string): void {
		// In case plugin was already built in the current process, we need to clean the old sources as they may break the new build.
		this.$fs.deleteDirectory(pluginTempDir);
		this.$fs.ensureDirectoryExists(pluginTempDir);
	}

	private getSourceFilesHashes(
		pluginTempPlatformsAndroidDir: string,
		shortPluginName: string
	): Promise<IStringDictionary> {
		const pathToAar = path.join(
			pluginTempPlatformsAndroidDir,
			`${shortPluginName}.aar`
		);
		const pluginNativeDataFiles = this.$fs.enumerateFilesInDirectorySync(
			pluginTempPlatformsAndroidDir,
			(file: string, stat: IFsStats) => file !== pathToAar
		);
		return this.$filesHashService.generateHashes(pluginNativeDataFiles);
	}

	private writePluginHashInfo(
		fileHashesInfo: IStringDictionary,
		pluginTempDir: string
	): void {
		const buildDataFile = this.getPathToPluginBuildDataFile(pluginTempDir);
		this.$fs.writeJson(buildDataFile, fileHashesInfo);
	}

	private async shouldBuildAar(opts: {
		manifestFilePath: string;
		androidSourceDirectories: string[];
		pluginTempDir: string;
		pluginSourceDir: string;
		shortPluginName: string;
		fileHashesInfo: IStringDictionary;
	}): Promise<boolean> {
		let shouldBuildAar =
			!!opts.manifestFilePath || !!opts.androidSourceDirectories.length;

		if (
			shouldBuildAar &&
			this.$fs.exists(opts.pluginTempDir) &&
			this.$fs.exists(
				path.join(opts.pluginSourceDir, `${opts.shortPluginName}.aar`)
			)
		) {
			const buildDataFile = this.getPathToPluginBuildDataFile(
				opts.pluginTempDir
			);
			if (this.$fs.exists(buildDataFile)) {
				const oldHashes = this.$fs.readJson(buildDataFile);
				shouldBuildAar = this.$filesHashService.hasChangesInShasums(
					oldHashes,
					opts.fileHashesInfo
				);
			}
		}

		return shouldBuildAar;
	}

	private getPathToPluginBuildDataFile(pluginDir: string): string {
		return path.join(pluginDir, PLUGIN_BUILD_DATA_FILENAME);
	}

	private async updateManifest(
		manifestFilePath: string,
		pluginTempMainSrcDir: string,
		shortPluginName: string
	): Promise<void> {
		let updatedManifestContent;
		this.$fs.ensureDirectoryExists(pluginTempMainSrcDir);
		const defaultPackageName = "org.nativescript." + shortPluginName;
		if (manifestFilePath) {
			let androidManifestContent;
			try {
				androidManifestContent = this.$fs.readText(manifestFilePath);
			} catch (err) {
				this.$errors.fail(
					`Failed to fs.readFileSync the manifest file located at ${manifestFilePath}. Error is: ${err.toString()}`
				);
			}

			updatedManifestContent = await this.updateManifestContent(
				androidManifestContent,
				defaultPackageName
			);
		} else {
			updatedManifestContent = this.createManifestContent(defaultPackageName);
		}

		const pathToTempAndroidManifest = path.join(
			pluginTempMainSrcDir,
			MANIFEST_FILE_NAME
		);
		try {
			this.$fs.writeFile(pathToTempAndroidManifest, updatedManifestContent);
		} catch (e) {
			this.$errors.fail(
				`Failed to write the updated AndroidManifest in the new location - ${pathToTempAndroidManifest}. Error is: ${e.toString()}`
			);
		}
	}

	private copySourceSetDirectories(
		androidSourceSetDirectories: string[],
		pluginTempMainSrcDir: string
	): void {
		for (const dir of androidSourceSetDirectories) {
			const dirName = path.basename(dir);
			const destination = path.join(pluginTempMainSrcDir, dirName);

			this.$fs.ensureDirectoryExists(destination);
			this.$fs.copyFile(path.join(dir, "*"), destination);
		}
	}

	private async setupGradle(
		pluginTempDir: string,
		platformsAndroidDirPath: string,
		projectDir: string,
		pluginName: string
	): Promise<void> {
		const gradleTemplatePath = path.resolve(
			path.join(__dirname, "../../vendor/gradle-plugin")
		);
		const allGradleTemplateFiles = path.join(gradleTemplatePath, "*");
		const buildGradlePath = path.join(pluginTempDir, "build.gradle");
		const settingsGradlePath = path.join(pluginTempDir, "settings.gradle");

		this.$fs.copyFile(allGradleTemplateFiles, pluginTempDir);
		this.addCompileDependencies(platformsAndroidDirPath, buildGradlePath);
		const runtimeGradleVersions = await this.getRuntimeGradleVersions(
			projectDir
		);
		this.replaceGradleVersion(
			pluginTempDir,
			runtimeGradleVersions.gradleVersion
		);
		this.replaceGradleAndroidPluginVersion(
			buildGradlePath,
			runtimeGradleVersions.gradleAndroidPluginVersion
		);
		this.replaceFileContent(buildGradlePath, "{{pluginName}}", pluginName);
		this.replaceFileContent(settingsGradlePath, "{{pluginName}}", pluginName);

		// gets the package from the AndroidManifest to use as the namespace or fallback to the `org.nativescript.${shortPluginName}`
		const shortPluginName = getShortPluginName(pluginName);

		const manifestPath = path.join(
			pluginTempDir,
			"src",
			"main",
			"AndroidManifest.xml"
		);
		const manifestContent = this.$fs.readText(manifestPath);

		let packageName = `org.nativescript.${shortPluginName}`;
		const xml = await this.getXml(manifestContent);
		if (xml["manifest"]) {
			if (xml["manifest"]["$"]["package"]) {
				packageName = xml["manifest"]["$"]["package"];
			}
		}

		this.replaceFileContent(
			buildGradlePath,
			"{{pluginNamespace}}",
			packageName
		);
	}

	private async getRuntimeGradleVersions(
		projectDir: string
	): Promise<IRuntimeGradleVersions> {
		let runtimeGradleVersions: IRuntimeGradleVersions = null;
		if (projectDir) {
			const projectData = this.$projectDataService.getProjectData(projectDir);
			const platformData = this.$platformsDataService.getPlatformData(
				this.$devicePlatformsConstants.Android,
				projectData
			);
			const projectRuntimeVersion =
				platformData.platformProjectService.getFrameworkVersion(projectData);
			runtimeGradleVersions = await this.getGradleVersions(
				projectRuntimeVersion
			);
			this.$logger.trace(
				`Got gradle versions ${JSON.stringify(
					runtimeGradleVersions
				)} from runtime v${projectRuntimeVersion}`
			);
		}

		if (!runtimeGradleVersions) {
			const latestRuntimeVersion = await this.getLatestRuntimeVersion();
			runtimeGradleVersions = await this.getGradleVersions(
				latestRuntimeVersion
			);
			this.$logger.trace(
				`Got gradle versions ${JSON.stringify(
					runtimeGradleVersions
				)} from the latest runtime v${latestRuntimeVersion}`
			);
		}

		return runtimeGradleVersions || {};
	}

	private async getLatestRuntimeVersion(): Promise<string> {
		let runtimeVersion: string = null;

		try {
			let result = await this.$packageManager.view(
				SCOPED_ANDROID_RUNTIME_NAME,
				{
					"dist-tags": true,
				}
			);
			result = result?.["dist-tags"] ?? result;
			runtimeVersion = result.latest;
		} catch (err) {
			this.$logger.trace(
				`Error while getting latest android runtime version from view command: ${err}`
			);
			const registryData = await this.$packageManager.getRegistryPackageData(
				SCOPED_ANDROID_RUNTIME_NAME
			);
			runtimeVersion = registryData["dist-tags"].latest;
		}

		return runtimeVersion;
	}

	private getLocalGradleVersions(): IRuntimeGradleVersions {
		// partial interface of the runtime package.json
		// including new 8.2+ format and legacy
		interface IRuntimePackageJSON {
			// 8.2+
			version_info?: {
				gradle: string;
				gradleAndroid: string;
			};
			// legacy
			gradle?: {
				version: string;
				android: string;
			};
		}

		// try reading from installed runtime first before reading from the npm registry...
		const installedRuntimePackageJSONPath = resolvePackageJSONPath(
			SCOPED_ANDROID_RUNTIME_NAME,
			{
				paths: [this.$projectData.projectDir],
			}
		);

		if (!installedRuntimePackageJSONPath) {
			return null;
		}

		const installedRuntimePackageJSON: IRuntimePackageJSON = this.$fs.readJson(
			installedRuntimePackageJSONPath
		);

		if (!installedRuntimePackageJSON) {
			return null;
		}

		if (installedRuntimePackageJSON.version_info) {
			const { gradle, gradleAndroid } =
				installedRuntimePackageJSON.version_info;

			return {
				gradleVersion: gradle,
				gradleAndroidPluginVersion: gradleAndroid,
			};
		}

		if (installedRuntimePackageJSON.gradle) {
			const { version, android } = installedRuntimePackageJSON.gradle;

			return {
				gradleVersion: version,
				gradleAndroidPluginVersion: android,
			};
		}

		return null;
	}

	private async getGradleVersions(
		runtimeVersion: string
	): Promise<IRuntimeGradleVersions> {
		let runtimeGradleVersions: {
			versions: { gradle: string; gradleAndroid: string };
		} = null;

		const localVersionInfo = this.getLocalGradleVersions();

		if (localVersionInfo) {
			return localVersionInfo;
		}

		// fallback to reading from npm...
		try {
			let output = await this.$packageManager.view(
				`${SCOPED_ANDROID_RUNTIME_NAME}@${runtimeVersion}`,
				{ version_info: true }
			);
			output = output?.["version_info"] ?? output;

			if (!output) {
				/**
				 * fallback to the old 'gradle' key in package.json
				 *
				 * format:
				 *
				 * gradle: { version: '6.4', android: '3.6.4' }
				 *
				 */
				output = await this.$packageManager.view(
					`${SCOPED_ANDROID_RUNTIME_NAME}@${runtimeVersion}`,
					{ gradle: true }
				);
				output = output?.["gradle"] ?? output;

				const { version, android } = output;

				// covert output to the new format...
				output = {
					gradle: version,
					gradleAndroid: android,
				};
			}

			runtimeGradleVersions = { versions: output };
		} catch (err) {
			this.$logger.trace(
				`Error while getting gradle data for android runtime from view command: ${err}`
			);
			const registryData = await this.$packageManager.getRegistryPackageData(
				SCOPED_ANDROID_RUNTIME_NAME
			);
			runtimeGradleVersions = registryData.versions[runtimeVersion];
		}

		const result = this.getGradleVersionsCore(runtimeGradleVersions);
		return result;
	}

	private getGradleVersionsCore(packageData: {
		versions: { gradle: string; gradleAndroid: string };
	}): IRuntimeGradleVersions {
		const packageJsonGradle = packageData && packageData.versions;
		let runtimeVersions: IRuntimeGradleVersions = null;
		if (
			packageJsonGradle &&
			(packageJsonGradle.gradle || packageJsonGradle.gradleAndroid)
		) {
			runtimeVersions = {};
			runtimeVersions.gradleVersion = packageJsonGradle.gradle;
			runtimeVersions.gradleAndroidPluginVersion =
				packageJsonGradle.gradleAndroid;
		}

		return runtimeVersions;
	}

	private replaceGradleVersion(pluginTempDir: string, version: string): void {
		const gradleVersion = version || AndroidBuildDefaults.GradleVersion;
		const gradleVersionPlaceholder = "{{runtimeGradleVersion}}";
		const gradleWrapperPropertiesPath = path.join(
			pluginTempDir,
			"gradle",
			"wrapper",
			"gradle-wrapper.properties"
		);

		this.replaceFileContent(
			gradleWrapperPropertiesPath,
			gradleVersionPlaceholder,
			gradleVersion
		);
	}

	private replaceGradleAndroidPluginVersion(
		buildGradlePath: string,
		version: string
	): void {
		const gradleAndroidPluginVersionPlaceholder =
			"{{runtimeAndroidPluginVersion}}";
		const gradleAndroidPluginVersion =
			version || AndroidBuildDefaults.GradleAndroidPluginVersion;

		this.replaceFileContent(
			buildGradlePath,
			gradleAndroidPluginVersionPlaceholder,
			gradleAndroidPluginVersion
		);
	}

	private replaceFileContent(
		filePath: string,
		content: string,
		replacement: string
	) {
		const fileContent = this.$fs.readText(filePath);
		const contentRegex = new RegExp(content, "g");
		const replacedFileContent = fileContent.replace(contentRegex, replacement);
		this.$fs.writeFile(filePath, replacedFileContent);
	}

	private addCompileDependencies(
		platformsAndroidDirPath: string,
		buildGradlePath: string
	): void {
		const includeGradlePath = path.join(
			platformsAndroidDirPath,
			INCLUDE_GRADLE_NAME
		);
		if (this.$fs.exists(includeGradlePath)) {
			const includeGradleContent = this.$fs.readText(includeGradlePath);
			const compileDependencies =
				this.getIncludeGradleCompileDependenciesScope(includeGradleContent);

			if (compileDependencies.length) {
				this.$fs.appendFile(
					buildGradlePath,
					"\n" + compileDependencies.join("\n")
				);
			}
		}
	}

	private copyAar(
		shortPluginName: string,
		pluginTempDir: string,
		aarOutputDir: string
	): void {
		const finalAarName = `${shortPluginName}-release.aar`;
		const pathToBuiltAar = path.join(
			pluginTempDir,
			"build",
			"outputs",
			"aar",
			finalAarName
		);

		if (this.$fs.exists(pathToBuiltAar)) {
			try {
				if (aarOutputDir) {
					this.$fs.copyFile(
						pathToBuiltAar,
						path.join(aarOutputDir, `${shortPluginName}.aar`)
					);
				}
			} catch (e) {
				this.$errors.fail(
					`Failed to copy built aar to destination. ${e.message}`
				);
			}
		} else {
			this.$errors.fail(`No built aar found at ${pathToBuiltAar}`);
		}
	}

	/**
	 * @param {Object} options
	 * @param {string} options.platformsAndroidDirPath - The path to the 'plugin/src/platforms/android' directory.
	 */
	public migrateIncludeGradle(options: IPluginBuildOptions): boolean {
		this.validatePlatformsAndroidDirPathOption(options);

		const includeGradleFilePath = path.join(
			options.platformsAndroidDirPath,
			INCLUDE_GRADLE_NAME
		);

		if (this.$fs.exists(includeGradleFilePath)) {
			let includeGradleFileContent: string;
			try {
				includeGradleFileContent = this.$fs
					.readFile(includeGradleFilePath)
					.toString();
			} catch (err) {
				this.$errors.fail(
					`Failed to fs.readFileSync the include.gradle file located at ${includeGradleFilePath}. Error is: ${err.toString()}`
				);
			}

			const productFlavorsScope = this.getScope(
				"productFlavors",
				includeGradleFileContent
			);
			if (productFlavorsScope) {
				try {
					const newIncludeGradleFileContent = includeGradleFileContent.replace(
						productFlavorsScope,
						""
					);
					this.$fs.writeFile(
						includeGradleFilePath,
						newIncludeGradleFileContent
					);

					return true;
				} catch (e) {
					this.$errors.fail(
						`Failed to write the updated include.gradle ` +
							`in - ${includeGradleFilePath}. Error is: ${e.toString()}`
					);
				}
			}
		}

		return false;
	}

	@hook("buildAndroidPlugin")
	private async buildPlugin(
		pluginBuildSettings: IBuildAndroidPluginData
	): Promise<void> {
		const gradlew =
			pluginBuildSettings.gradlePath ??
			(this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew");

		const localArgs = [
			"-p",
			pluginBuildSettings.pluginDir,
			"assembleRelease",
			`-PtempBuild=true`,
			`-PappPath=${this.$projectData.getAppDirectoryPath()}`,
			`-PappResourcesPath=${this.$projectData.getAppResourcesDirectoryPath()}`,
		];

		if (pluginBuildSettings.gradleArgs) {
			localArgs.push(pluginBuildSettings.gradleArgs);
		}

		if (this.$logger.getLevel() === "INFO") {
			localArgs.push("--quiet");
		}

		const opts: any = {
			cwd: pluginBuildSettings.pluginDir,
			stdio: "inherit",
			shell: this.$hostInfo.isWindows,
		};

		if (this.$options.hostProjectPath) {
			opts.env = {
				USER_PROJECT_PLATFORMS_ANDROID: path.resolve(
					cwd(),
					this.$options.hostProjectPath
				), // TODO: couldn't `hostProjectPath` have an absolute path already?
				...process.env, // TODO: any other way to pass automatically the current process.env?
			};
		}

		try {
			await this.$childProcess.spawnFromEvent(
				gradlew,
				localArgs,
				"close",
				opts
			);
		} catch (err) {
			this.$errors.fail(
				`Failed to build plugin ${pluginBuildSettings.pluginName} : \n${err}`
			);
		}
	}

	private validateOptions(options: IPluginBuildOptions): void {
		if (!options) {
			this.$errors.fail(
				"Android plugin cannot be built without passing an 'options' object."
			);
		}

		if (!options.pluginName) {
			this.$logger.info("No plugin name provided, defaulting to 'myPlugin'.");
		}

		if (!options.aarOutputDir) {
			this.$logger.info(
				"No aarOutputDir provided, defaulting to the build outputs directory of the plugin"
			);
		}

		if (!options.tempPluginDirPath) {
			this.$errors.fail(
				"Android plugin cannot be built without passing the path to a directory where the temporary project should be built."
			);
		}

		this.validatePlatformsAndroidDirPathOption(options);
	}

	private validatePlatformsAndroidDirPathOption(
		options: IPluginBuildOptions
	): void {
		if (!options) {
			this.$errors.fail(
				"Android plugin cannot be built without passing an 'options' object."
			);
		}

		if (!options.platformsAndroidDirPath) {
			this.$errors.fail(
				"Android plugin cannot be built without passing the path to the platforms/android dir."
			);
		}
	}
}

injector.register("androidPluginBuildService", AndroidPluginBuildService);
