import * as path from "path";
import { ProjectData } from "../project-data";
import * as constants from "../constants";
import {
	AssetConstants,
	CLI_RESOURCES_DIR_NAME,
	MAIN_DIR,
	NATIVESCRIPT_PROPS_INTERNAL_DELIMITER,
	NODE_MODULES_FOLDER_NAME,
	PlatformTypes,
	ProjectTypes,
	RESOURCES_DIR,
	SRC_DIR,
} from "../constants";
import { parseJson } from "../common/helpers";
import { exported, memoize } from "../common/decorators";
import {
	IAssetGroup,
	IAssetItem,
	IAssetsStructure,
	IAssetSubGroup,
	IImageDefinitionsStructure,
	INsConfig,
	IProjectData,
	IProjectDataService,
} from "../definitions/project";
import {
	IAndroidResourcesMigrationService,
	IStaticConfig,
} from "../declarations";
import { IBasePluginData, IPluginsService } from "../definitions/plugins";
import { IDictionary, IFileSystem, IProjectDir } from "../common/declarations";
import * as _ from "lodash";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import * as semver from "semver";
import { resolvePackageJSONPath } from "../helpers/package-path-helper";

interface IProjectFileData {
	projectData: any;
	projectFilePath: string;
}

export class ProjectDataService implements IProjectDataService {
	private defaultProjectDir: string;
	private static DEPENDENCIES_KEY_NAME = "dependencies";
	private projectDataCache: IDictionary<IProjectData> = {};

	constructor(
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $injector: IInjector
	) {
		try {
			// add the ProjectData of the default projectDir to the projectData cache
			const projectData = this.$injector.resolve("projectData");
			projectData.initializeProjectData();
			this.defaultProjectDir = projectData.projectDir;
			this.projectDataCache[this.defaultProjectDir] = projectData;
		} catch (e) {
			// the CLI is required as a lib from a non-project folder
		}
	}

	get $pluginsService(): IPluginsService {
		return this.$injector.resolve("pluginsService");
	}

	public getNSValue(projectDir: string, propertyName: string): any {
		return this.getValue(
			projectDir,
			this.getNativeScriptPropertyName(propertyName)
		);
	}

	public getNSValueFromContent(jsonData: Object, propertyName: string): any {
		try {
			return this.getPropertyValueFromJson(
				jsonData,
				this.getNativeScriptPropertyName(propertyName)
			);
		} catch (e) {
			this.$logger.trace(
				"Failed to get NS property value from JSON project data."
			);
		}

		return null;
	}

	public setNSValue(projectDir: string, key: string, value: any): void {
		this.setValue(projectDir, this.getNativeScriptPropertyName(key), value);
	}

	public removeNSProperty(projectDir: string, propertyName: string): void {
		this.removeProperty(
			projectDir,
			this.getNativeScriptPropertyName(propertyName)
		);
	}

	public removeDependency(projectDir: string, dependencyName: string): void {
		const projectFileInfo = this.getProjectFileData(projectDir);
		delete projectFileInfo.projectData[
			ProjectDataService.DEPENDENCIES_KEY_NAME
		][dependencyName];
		this.$fs.writeJson(
			projectFileInfo.projectFilePath,
			projectFileInfo.projectData
		);
	}

	// TODO: Add tests
	// TODO: Remove $projectData and replace it with $projectDataService.getProjectData
	@exported("projectDataService")
	public getProjectData(projectDir: string): IProjectData {
		projectDir = projectDir || this.defaultProjectDir;
		this.projectDataCache[projectDir] =
			this.projectDataCache[projectDir] ||
			this.$injector.resolve<IProjectData>(ProjectData);
		this.projectDataCache[projectDir].initializeProjectData(projectDir);
		return this.projectDataCache[projectDir];
	}

	@exported("projectDataService")
	public getProjectDataFromContent(
		packageJsonContent: string,
		projectDir?: string
	): IProjectData {
		projectDir = projectDir || this.defaultProjectDir;
		this.projectDataCache[projectDir] =
			this.projectDataCache[projectDir] ||
			this.$injector.resolve<IProjectData>(ProjectData);
		this.projectDataCache[projectDir].initializeProjectDataFromContent(
			packageJsonContent,
			projectDir
		);
		return this.projectDataCache[projectDir];
	}

	@exported("projectDataService")
	public async getAssetsStructure(
		opts: IProjectDir
	): Promise<IAssetsStructure> {
		const iOSAssetStructure = await this.getIOSAssetsStructure(opts);
		const androidAssetStructure = await this.getAndroidAssetsStructure(opts);

		this.$logger.trace(
			"iOS Assets structure:",
			JSON.stringify(iOSAssetStructure, null, 2)
		);
		this.$logger.trace(
			"Android Assets structure:",
			JSON.stringify(androidAssetStructure, null, 2)
		);

		return {
			ios: iOSAssetStructure,
			android: androidAssetStructure,
		};
	}

	@exported("projectDataService")
	public async getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		const projectDir = opts.projectDir;
		const projectData = this.getProjectData(projectDir);

		const basePath = path.join(
			projectData.appResourcesDirectoryPath,
			this.$devicePlatformsConstants.iOS,
			AssetConstants.iOSAssetsDirName
		);
		const pathToIcons = path.join(basePath, AssetConstants.iOSIconsDirName);
		const icons = await this.getIOSAssetSubGroup(pathToIcons);

		const pathToSplashBackgrounds = path.join(
			basePath,
			AssetConstants.iOSSplashBackgroundsDirName
		);
		const splashBackgrounds = await this.getIOSAssetSubGroup(
			pathToSplashBackgrounds
		);

		const pathToSplashCenterImages = path.join(
			basePath,
			AssetConstants.iOSSplashCenterImagesDirName
		);
		const splashCenterImages = await this.getIOSAssetSubGroup(
			pathToSplashCenterImages
		);

		const pathToSplashImages = path.join(
			basePath,
			AssetConstants.iOSSplashImagesDirName
		);
		const splashImages = await this.getIOSAssetSubGroup(pathToSplashImages);

		return {
			icons,
			splashBackgrounds,
			splashCenterImages,
			splashImages,
		};
	}

	public removeNSConfigProperty(
		projectDir: string,
		propertyName: string
	): void {
		this.$logger.trace(`Removing "${propertyName}" property from nsconfig.`);
		this.updateNsConfigValue(projectDir, null, [propertyName]);
		this.$logger.trace(`"${propertyName}" property successfully removed.`);
	}

	@exported("projectDataService")
	public async getAndroidAssetsStructure(
		opts: IProjectDir
	): Promise<IAssetGroup> {
		// TODO: Use image-size package to get the width and height of an image.
		// TODO: Parse the splash_screen.xml in nodpi directory and get from it the names of the background and center image.
		// TODO: Parse the AndroidManifest.xml to get the name of the icon.
		// This way we'll not use the image-definitions.json and the method will return the real android structure.
		const projectDir = opts.projectDir;
		const projectData = this.getProjectData(projectDir);
		const pathToAndroidDir = path.join(
			projectData.appResourcesDirectoryPath,
			this.$devicePlatformsConstants.Android
		);
		const hasMigrated = this.$androidResourcesMigrationService.hasMigrated(
			projectData.appResourcesDirectoryPath
		);
		const basePath = hasMigrated
			? path.join(pathToAndroidDir, SRC_DIR, MAIN_DIR, RESOURCES_DIR)
			: pathToAndroidDir;

		let useLegacy = false;
		try {
			const manifest = this.$fs.readText(
				path.resolve(basePath, "../AndroidManifest.xml")
			);
			useLegacy = !manifest.includes(`android:icon="@mipmap/ic_launcher"`);
		} catch (err) {
			// ignore
		}

		const content = this.getImageDefinitions()[
			useLegacy ? "android_legacy" : "android"
		];

		return {
			icons: this.getAndroidAssetSubGroup(content.icons, basePath),
			splashBackgrounds: this.getAndroidAssetSubGroup(
				content.splashBackgrounds,
				basePath
			),
			splashCenterImages: this.getAndroidAssetSubGroup(
				content.splashCenterImages,
				basePath
			),
			splashImages: null,
		};
	}

	public getAppExecutableFiles(projectDir: string): string[] {
		const projectData = this.getProjectData(projectDir);

		let supportedFileExtension = ".js";
		if (
			projectData.projectType === ProjectTypes.NgFlavorName ||
			projectData.projectType === ProjectTypes.TsFlavorName
		) {
			supportedFileExtension = ".ts";
		}

		const pathToProjectNodeModules = path.join(
			projectDir,
			NODE_MODULES_FOLDER_NAME
		);
		const files = this.$fs.enumerateFilesInDirectorySync(
			projectData.appDirectoryPath,
			(filePath, fstat) => {
				if (filePath.indexOf(projectData.appResourcesDirectoryPath) !== -1) {
					return false;
				}

				if (fstat.isDirectory()) {
					if (filePath === pathToProjectNodeModules) {
						// we do not want to get the files from node_modules directory of the project.
						// We'll get here only when you have nativescript.config with appDirectoryPath set to "."
						return false;
					}

					return true;
				}

				return path.extname(filePath) === supportedFileExtension;
			}
		);

		return files;
	}

	private refreshProjectData(projectDir: string) {
		if (this.projectDataCache[projectDir]) {
			this.projectDataCache[projectDir].initializeProjectData(projectDir);
		}
	}

	private updateNsConfigValue(
		projectDir: string,
		updateObject?: INsConfig,
		propertiesToRemove?: string[]
	): void {
		// todo: figure out a way to update js/ts configs
		// most likely needs an ast parser/writer
		// should be delegated to the config service
		const nsConfigPath = path.join(projectDir, constants.CONFIG_FILE_NAME_JS);
		const currentNsConfig = this.getNsConfig(nsConfigPath);
		let newNsConfig = currentNsConfig;
		if (updateObject) {
			newNsConfig = _.assign(
				newNsConfig || this.getNsConfigDefaultObject(),
				updateObject
			);
		}

		if (newNsConfig && propertiesToRemove && propertiesToRemove.length) {
			newNsConfig = _.omit(newNsConfig, propertiesToRemove);
		}

		if (newNsConfig) {
			this.$fs.writeJson(nsConfigPath, newNsConfig);
			this.refreshProjectData(projectDir);
		}
	}

	private getNsConfig(nsConfigPath: string): INsConfig {
		let result: INsConfig = null;
		if (this.$fs.exists(nsConfigPath)) {
			const nsConfigContent = this.$fs.readText(nsConfigPath);
			try {
				result = <INsConfig>parseJson(nsConfigContent);
			} catch (e) {
				this.$logger.trace(
					"The `nsconfig` content is not a valid JSON. Parse error: ",
					e
				);
			}
		}

		return result;
	}

	private getImageDefinitions(): IImageDefinitionsStructure {
		const pathToImageDefinitions = path.join(
			__dirname,
			"..",
			"..",
			CLI_RESOURCES_DIR_NAME,
			AssetConstants.assets,
			AssetConstants.imageDefinitionsFileName
		);
		const imageDefinitions = this.$fs.readJson(pathToImageDefinitions);

		return imageDefinitions;
	}

	private async getIOSAssetSubGroup(dirPath: string): Promise<IAssetSubGroup> {
		const pathToContentJson = path.join(
			dirPath,
			AssetConstants.iOSResourcesFileName
		);
		const content = (this.$fs.exists(pathToContentJson) &&
			<IAssetSubGroup>this.$fs.readJson(pathToContentJson)) || { images: [] };
		const finalContent: IAssetSubGroup = { images: [] };

		const imageDefinitions = this.getImageDefinitions().ios;

		_.each(content && content.images, (image) => {
			let foundMatchingDefinition = false;
			// In some cases the image may not be available, it will just be described.
			// When this happens, the filename will be empty.
			// So we'll keep the path empty as well.
			if (image.filename) {
				image.path = path.join(dirPath, image.filename);
			}

			if (image.size) {
				// size is basically <width>x<height>
				const [width, height] = image.size
					.toString()
					.split(AssetConstants.sizeDelimiter);
				if (width && height) {
					image.width = +width;
					image.height = +height;
				}
			}

			// Find the image size based on the hardcoded values in the image-definitions.json
			_.each(imageDefinitions, (assetSubGroup: IAssetItem[]) => {
				const assetItem = _.find(
					assetSubGroup,
					(assetElement) =>
						assetElement.filename === image.filename &&
						path.basename(assetElement.directory) === path.basename(dirPath)
				);

				if (assetItem) {
					foundMatchingDefinition = true;
					if (!image.width || !image.height) {
						image.width = assetItem.width;
						image.height = assetItem.height;
						image.size =
							image.size ||
							`${assetItem.width}${AssetConstants.sizeDelimiter}${assetItem.height}`;
					}

					image.resizeOperation =
						image.resizeOperation || assetItem.resizeOperation;
					image.overlayImageScale =
						image.overlayImageScale || assetItem.overlayImageScale;
					image.scale = image.scale || assetItem.scale;
					image.rgba = assetItem.rgba;
					finalContent.images.push(image);
					// break each
					return false;
				}
			});

			if (!foundMatchingDefinition) {
				if (image.height && image.width) {
					this.$logger.trace(
						"Missing data for image",
						image,
						" in CLI's resource file, but we will try to generate images based on the size from Contents.json"
					);
					finalContent.images.push(image);
				} else if (image.filename) {
					this.$logger.warn(
						`Didn't find a matching image definition for file ${path.join(
							path.basename(dirPath),
							image.filename
						)}. This file will be skipped from resources generation.`
					);
				} else {
					this.$logger.trace(
						`Unable to detect data for image generation of image`,
						image
					);
				}
			}
		});

		return finalContent;
	}

	private getAndroidAssetSubGroup(
		assetItems: IAssetItem[],
		basePath: string
	): IAssetSubGroup {
		const assetSubGroup: IAssetSubGroup = {
			images: <any>[],
		};

		_.each(assetItems, (assetItem) => {
			const imagePath = path.join(
				basePath,
				assetItem.directory,
				assetItem.filename
			);
			assetItem.path = imagePath;
			if (assetItem.width && assetItem.height) {
				assetItem.size = `${assetItem.width}${AssetConstants.sizeDelimiter}${assetItem.height}`;
			}
			assetSubGroup.images.push(assetItem);
		});

		return assetSubGroup;
	}

	private getValue(projectDir: string, propertyName: string): any {
		const projectData = this.getProjectFileData(projectDir).projectData;

		if (projectData) {
			try {
				return this.getPropertyValueFromJson(projectData, propertyName);
			} catch (err) {
				this.$logger.trace(
					`Error while trying to get property ${propertyName} from ${projectDir}. Error is:`,
					err
				);
			}
		}

		return null;
	}

	private getNativeScriptPropertyName(propertyName: string) {
		return `${this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE}${NATIVESCRIPT_PROPS_INTERNAL_DELIMITER}${propertyName}`;
	}

	private getPropertyValueFromJson(
		jsonData: any,
		dottedPropertyName: string
	): any {
		const props = dottedPropertyName.split(
			NATIVESCRIPT_PROPS_INTERNAL_DELIMITER
		);
		let result = jsonData[props.shift()];

		for (const prop of props) {
			result = result[prop];
		}

		return result;
	}

	private setValue(projectDir: string, key: string, value: any): void {
		const projectFileInfo = this.getProjectFileData(projectDir);

		const props = key.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
		const data: any = projectFileInfo.projectData;
		let currentData = data;

		_.each(props, (prop, index: number) => {
			if (index === props.length - 1) {
				currentData[prop] = value;
			} else {
				currentData[prop] = currentData[prop] || Object.create(null);
			}

			currentData = currentData[prop];
		});

		this.$fs.writeJson(projectFileInfo.projectFilePath, data);
	}

	private removeProperty(projectDir: string, propertyName: string): void {
		const projectFileInfo = this.getProjectFileData(projectDir);
		const data: any = projectFileInfo.projectData;
		let currentData = data;
		const props = propertyName.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
		const propertyToDelete = props.splice(props.length - 1, 1)[0];

		_.each(props, (prop) => {
			currentData = currentData[prop];
		});

		delete currentData[propertyToDelete];
		this.$fs.writeJson(projectFileInfo.projectFilePath, data);
	}

	private getProjectFileData(projectDir: string): IProjectFileData {
		const projectFilePath = path.join(
			projectDir,
			this.$staticConfig.PROJECT_FILE_NAME
		);
		const projectFileContent = this.$fs.readText(projectFilePath);
		const projectData = projectFileContent
			? JSON.parse(projectFileContent)
			: Object.create(null);

		return {
			projectData,
			projectFilePath,
		};
	}

	private getNsConfigDefaultObject(data?: Object): INsConfig {
		const config: INsConfig = {};
		Object.assign(config, data);

		return config;
	}

	public getRuntimePackage(
		projectDir: string,
		platform: constants.SupportedPlatform
	): IBasePluginData {
		platform = platform.toLowerCase() as constants.SupportedPlatform;
		const packageJson = this.$fs.readJson(
			path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME)
		);
		const runtimeName =
			platform === PlatformTypes.android
				? constants.TNS_ANDROID_RUNTIME_NAME
				: constants.TNS_IOS_RUNTIME_NAME;

		if (
			packageJson &&
			packageJson.nativescript &&
			packageJson.nativescript[runtimeName] &&
			packageJson.nativescript[runtimeName].version
		) {
			// if we have a nativescript key with a runtime version in package.json
			// that means we are dealing with a legacy project, and should respect
			// that information
			return {
				name: runtimeName,
				version: packageJson.nativescript[runtimeName].version,
			};
		}

		return this.getInstalledRuntimePackage(projectDir, platform);
	}

	@memoize({
		hashFn(projectDir: string, platform: constants.SupportedPlatform) {
			return projectDir + ":" + platform;
		},
		shouldCache(result: IBasePluginData) {
			// don't cache coerced versions
			if ((result as any)._coerced) {
				return false;
			}

			// only cache if version is defined
			return !!result.version;
		},
	})
	private getInstalledRuntimePackage(
		projectDir: string,
		platform: constants.SupportedPlatform
	): IBasePluginData {
		const runtimePackage = this.$pluginsService
			.getDependenciesFromPackageJson(projectDir)
			.devDependencies.find((d) => {
				if (platform === constants.PlatformTypes.ios) {
					return [
						constants.SCOPED_IOS_RUNTIME_NAME,
						constants.TNS_IOS_RUNTIME_NAME,
					].includes(d.name);
				} else if (platform === constants.PlatformTypes.android) {
					return [
						constants.SCOPED_ANDROID_RUNTIME_NAME,
						constants.TNS_ANDROID_RUNTIME_NAME,
					].includes(d.name);
				}
			});

		if (runtimePackage) {
			const coerced = semver.coerce(runtimePackage.version);
			const isRange = !!coerced && coerced.version !== runtimePackage.version;
			const isTag = !coerced;

			// in case we are using a local tgz for the runtime or a range like ~8.0.0, ^8.0.0 etc. or a tag like JSC
			if (runtimePackage.version.includes("tgz") || isRange || isTag) {
				try {
					const runtimePackageJsonPath = resolvePackageJSONPath(
						runtimePackage.name,
						{
							paths: [projectDir],
						}
					);

					if (!runtimePackageJsonPath) {
						// caught below
						throw new Error("Runtime package.json not found.");
					}

					runtimePackage.version = this.$fs.readJson(
						runtimePackageJsonPath
					).version;
				} catch (err) {
					if (isRange) {
						runtimePackage.version = semver.coerce(
							runtimePackage.version
						).version;

						(runtimePackage as any)._coerced = true;
					} else {
						runtimePackage.version = null;
					}
				}
			}

			return runtimePackage;
		}

		// default to the scoped runtimes
		this.$logger.trace(
			"Could not find an installed runtime, falling back to default runtimes"
		);
		if (platform === constants.PlatformTypes.ios) {
			return {
				name: constants.SCOPED_IOS_RUNTIME_NAME,
				version: null,
			};
		} else if (platform === constants.PlatformTypes.android) {
			return {
				name: constants.SCOPED_ANDROID_RUNTIME_NAME,
				version: null,
			};
		}
	}

	@exported("projectDataService")
	public getNsConfigDefaultContent(data?: Object): string {
		const config = this.getNsConfigDefaultObject(data);

		return JSON.stringify(config);
	}
}

injector.register("projectDataService", ProjectDataService);
