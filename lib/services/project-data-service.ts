import * as path from "path";
import { ProjectData } from "../project-data";
import { exported } from "../common/decorators";
import { NATIVESCRIPT_PROPS_INTERNAL_DELIMITER, AssetConstants, SRC_DIR, RESOURCES_DIR, MAIN_DIR, CLI_RESOURCES_DIR_NAME } from "../constants";
import * as imageSize from "image-size";

interface IProjectFileData {
	projectData: any;
	projectFilePath: string;
}

export class ProjectDataService implements IProjectDataService {
	private static DEPENDENCIES_KEY_NAME = "dependencies";

	constructor(private $fs: IFileSystem,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $injector: IInjector) {
	}

	public getNSValue(projectDir: string, propertyName: string): any {
		return this.getValue(projectDir, this.getNativeScriptPropertyName(propertyName));
	}

	public setNSValue(projectDir: string, key: string, value: any): void {
		this.setValue(projectDir, this.getNativeScriptPropertyName(key), value);
	}

	public removeNSProperty(projectDir: string, propertyName: string): void {
		this.removeProperty(projectDir, this.getNativeScriptPropertyName(propertyName));
	}

	public removeDependency(projectDir: string, dependencyName: string): void {
		const projectFileInfo = this.getProjectFileData(projectDir);
		delete projectFileInfo.projectData[ProjectDataService.DEPENDENCIES_KEY_NAME][dependencyName];
		this.$fs.writeJson(projectFileInfo.projectFilePath, projectFileInfo.projectData);
	}

	// TODO: Add tests
	// TODO: Remove $projectData and replace it with $projectDataService.getProjectData
	@exported("projectDataService")
	public getProjectData(projectDir: string): IProjectData {
		const projectDataInstance = this.$injector.resolve<IProjectData>(ProjectData);
		projectDataInstance.initializeProjectData(projectDir);
		return projectDataInstance;
	}

	@exported("projectDataService")
	public getProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): IProjectData {
		const projectDataInstance = this.$injector.resolve<IProjectData>(ProjectData);
		projectDataInstance.initializeProjectDataFromContent(packageJsonContent, nsconfigContent, projectDir);
		return projectDataInstance;
	}

	@exported("projectDataService")
	public async getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure> {
		const iOSAssetStructure = await this.getIOSAssetsStructure(opts);
		const androidAssetStructure = await this.getAndroidAssetsStructure(opts);

		this.$logger.trace("iOS Assets structure:", JSON.stringify(iOSAssetStructure, null, 2));
		this.$logger.trace("Android Assets structure:", JSON.stringify(androidAssetStructure, null, 2));

		return {
			ios: iOSAssetStructure,
			android: androidAssetStructure
		};
	}

	@exported("projectDataService")
	public async getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		const projectDir = opts.projectDir;
		const projectData = this.getProjectData(projectDir);

		const basePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.iOS, AssetConstants.iOSAssetsDirName);
		const pathToIcons = path.join(basePath, AssetConstants.iOSIconsDirName);
		const icons = await this.getIOSAssetSubGroup(pathToIcons);

		const pathToSplashBackgrounds = path.join(basePath, AssetConstants.iOSSplashBackgroundsDirName);
		const splashBackgrounds = await this.getIOSAssetSubGroup(pathToSplashBackgrounds);

		const pathToSplashCenterImages = path.join(basePath, AssetConstants.iOSSplashCenterImagesDirName);
		const splashCenterImages = await this.getIOSAssetSubGroup(pathToSplashCenterImages);

		const pathToSplashImages = path.join(basePath, AssetConstants.iOSSplashImagesDirName);
		const splashImages = await this.getIOSAssetSubGroup(pathToSplashImages);

		return {
			icons,
			splashBackgrounds,
			splashCenterImages,
			splashImages
		};
	}

	@exported("projectDataService")
	public async getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		// TODO: Use image-size package to get the width and height of an image.
		// TODO: Parse the splash_screen.xml in nodpi directory and get from it the names of the background and center image.
		// TODO: Parse the AndroidManifest.xml to get the name of the icon.
		// This way we'll not use the image-definitions.json and the method will return the real android structure.
		const projectDir = opts.projectDir;
		const projectData = this.getProjectData(projectDir);
		const pathToAndroidDir = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android);
		const hasMigrated = this.$androidResourcesMigrationService.hasMigrated(projectData.appResourcesDirectoryPath);
		const basePath = hasMigrated ? path.join(pathToAndroidDir, SRC_DIR, MAIN_DIR, RESOURCES_DIR) : pathToAndroidDir;

		const currentStructure = this.$fs.enumerateFilesInDirectorySync(basePath);
		const content = this.getImageDefinitions().android;

		return {
			icons: this.getAndroidAssetSubGroup(content.icons, currentStructure),
			splashBackgrounds: this.getAndroidAssetSubGroup(content.splashBackgrounds, currentStructure),
			splashCenterImages: this.getAndroidAssetSubGroup(content.splashCenterImages, currentStructure),
			splashImages: null
		};
	}

	private getImageDefinitions(): IImageDefinitionsStructure {
		const pathToImageDefinitions = path.join(__dirname, "..", "..", CLI_RESOURCES_DIR_NAME, AssetConstants.assets, AssetConstants.imageDefinitionsFileName);
		const imageDefinitions = this.$fs.readJson(pathToImageDefinitions);

		return imageDefinitions;
	}

	private async getIOSAssetSubGroup(dirPath: string): Promise<IAssetSubGroup> {
		const pathToContentJson = path.join(dirPath, AssetConstants.iOSResourcesFileName);
		const content = this.$fs.exists(pathToContentJson) && <IAssetSubGroup>this.$fs.readJson(pathToContentJson) || { images: [] };

		const imageDefinitions = this.getImageDefinitions().ios;

		_.each(content && content.images, image => {
			// In some cases the image may not be available, it will just be described.
			// When this happens, the filename will be empty.
			// So we'll keep the path empty as well.
			if (image.filename) {
				image.path = path.join(dirPath, image.filename);
			}

			// Find the image size based on the hardcoded values in the image-definitions.json
			_.each(imageDefinitions, (assetSubGroup: IAssetItem[]) => {
				const assetItem = _.find(assetSubGroup, assetElement =>
					assetElement.filename === image.filename && path.basename(assetElement.directory) === path.basename(dirPath)
				);

				if (image.size) {
					// size is basically <width>x<height>
					const [width, height] = image.size.toString().split(AssetConstants.sizeDelimiter);
					if (width && height) {
						image.width = +width;
						image.height = +height;
					}
				}

				console.log("IMAGE", image, "ASSET ITEM", assetItem);

				if (assetItem) {
					if (!image.width || !image.height) {
						image.width = assetItem.width;
						image.height = assetItem.height;
						image.size = image.size || `${assetItem.width}${AssetConstants.sizeDelimiter}${assetItem.height}`;
					}

					image.resizeOperation = image.resizeOperation || assetItem.resizeOperation;
					image.overlayImageScale = image.overlayImageScale || assetItem.overlayImageScale;
					image.scale = image.scale || assetItem.scale;
					// break each
					return false;
				}
			});

			// if ((!image.width || !image.height) && image.path) {
			// 	try {
			// 		const dimensions = imageSize(image.path);
			// 		image.width = dimensions.width;
			// 		image.height = dimensions.height;
			// 		image.size = `${image.width}${AssetConstants.sizeDelimiter}${image.height}`;
			// 		// As we are using original size, ensure the scale is correct.
			// 		image.scale = "1x";
			// 		console.log(image);
			// 	} catch (err) {
			// 		this.$logger.trace(`Unable to get size of image ${image.path}. Error is`, err);
			// 	}
			// }
		});

		return content;
	}

	private getAndroidAssetSubGroup(assetItems: IAssetItem[], realPaths: string[]): IAssetSubGroup {
		const assetSubGroup: IAssetSubGroup = {
			images: <any>[]
		};

		const normalizedPaths = _.map(realPaths, p => path.normalize(p));
		_.each(assetItems, assetItem => {
			_.each(normalizedPaths, currentNormalizedPath => {
				const imagePath = path.join(assetItem.directory, assetItem.filename);
				if (currentNormalizedPath.indexOf(path.normalize(imagePath)) !== -1) {
					assetItem.path = currentNormalizedPath;
					assetItem.size = `${assetItem.width}${AssetConstants.sizeDelimiter}${assetItem.height}`;
					assetSubGroup.images.push(assetItem);
					return false;
				}
			});
		});

		return assetSubGroup;
	}

	private getValue(projectDir: string, propertyName: string): any {
		const projectData = this.getProjectFileData(projectDir).projectData;

		if (projectData) {
			try {
				return this.getPropertyValueFromJson(projectData, propertyName);
			} catch (err) {
				this.$logger.trace(`Error while trying to get property ${propertyName} from ${projectDir}. Error is:`, err);
			}
		}

		return null;
	}

	private getNativeScriptPropertyName(propertyName: string) {
		return `${this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE}${NATIVESCRIPT_PROPS_INTERNAL_DELIMITER}${propertyName}`;
	}

	private getPropertyValueFromJson(jsonData: any, dottedPropertyName: string): any {
		const props = dottedPropertyName.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
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
			if (index === (props.length - 1)) {
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
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		const projectFileContent = this.$fs.readText(projectFilePath);
		const projectData = projectFileContent ? JSON.parse(projectFileContent) : Object.create(null);

		return {
			projectData,
			projectFilePath
		};
	}

	@exported("projectDataService")
	public getNsConfigDefaultContent(data?: Object): string {
		const config: INsConfig = {};
		Object.assign(config, data);

		return JSON.stringify(config);
	}
}
$injector.register("projectDataService", ProjectDataService);
