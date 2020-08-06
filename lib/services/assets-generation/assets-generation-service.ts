import * as Jimp from "jimp";
import * as Color from "color";
import { exported } from "../../common/decorators";
import { AssetConstants } from '../../constants';

export const enum Operations {
	OverlayWith = "overlayWith",
	Blank = "blank",
	Resize = "resize"
}

export class AssetsGenerationService implements IAssetsGenerationService {
	private get propertiesToEnumerate(): IDictionary<string[]> {
		return {
			icon: ["icons"],
			splash: ["splashBackgrounds", "splashCenterImages", "splashImages"]
		};
	}

	constructor(private $logger: ILogger,
		private $projectDataService: IProjectDataService) {
	}

	@exported("assetsGenerationService")
	public async generateIcons(resourceGenerationData: IResourceGenerationData): Promise<void> {
		this.$logger.info("Generating icons ...");
		await this.generateImagesForDefinitions(resourceGenerationData, this.propertiesToEnumerate.icon);
		this.$logger.info("Icons generation completed.");
	}

	@exported("assetsGenerationService")
	public async generateSplashScreens(splashesGenerationData: ISplashesGenerationData): Promise<void> {
		this.$logger.info("Generating splash screens ...");
		await this.generateImagesForDefinitions(splashesGenerationData, this.propertiesToEnumerate.splash);
		this.$logger.info("Splash screens generation completed.");
	}

	private async generateImagesForDefinitions(generationData: ISplashesGenerationData, propertiesToEnumerate: string[]): Promise<void> {
		generationData.background = generationData.background || "white";
		const assetsStructure = await this.$projectDataService.getAssetsStructure(generationData);

		const assetItems = _(assetsStructure)
			.filter((assetGroup: IAssetGroup, platform: string) =>
				!generationData.platform || platform.toLowerCase() === generationData.platform.toLowerCase()
			)
			.map((assetGroup: IAssetGroup) =>
				_.filter(assetGroup, (assetSubGroup: IAssetSubGroup, imageTypeKey: string) =>
					assetSubGroup && propertiesToEnumerate.indexOf(imageTypeKey) !== -1
				)
			)
			.flatten()
			.map(assetSubGroup => assetSubGroup.images)
			.flatten()
			.filter(assetItem => !!assetItem.filename)
			.value();

		for (const assetItem of assetItems) {
			const operation = assetItem.resizeOperation || Operations.Resize;
			let tempScale: number = null;
			if (assetItem.scale) {
				if (_.isNumber(assetItem.scale)) {
					tempScale = assetItem.scale;
				} else {
					const splittedElements = `${assetItem.scale}`.split(AssetConstants.sizeDelimiter);
					tempScale = splittedElements && splittedElements.length && splittedElements[0] && +splittedElements[0];
				}
			}

			const scale = tempScale || AssetConstants.defaultScale;

			const outputPath = assetItem.path;
			const width = assetItem.width * scale;
			const height = assetItem.height * scale;

			if (!width || !height) {
				this.$logger.warn(`Image ${assetItem.filename} is skipped as its width and height are invalid.`);
				continue;
			}

			let image: Jimp;
			switch (operation) {
				case Operations.OverlayWith:
					const overlayImageScale = assetItem.overlayImageScale || AssetConstants.defaultOverlayImageScale;
					const imageResize = Math.round(Math.min(width, height) * overlayImageScale);
					image = await this.resize(generationData.imagePath, imageResize, imageResize);
					image = this.generateImage(generationData.background, width, height, outputPath, image);
					break;
				case Operations.Blank:
					image = this.generateImage(generationData.background, width, height, outputPath);
					break;
				case Operations.Resize:
					image = await this.resize(generationData.imagePath, width, height);
					break;
				default:
					throw new Error(`Invalid image generation operation: ${operation}`);
			}

			// This code disables the alpha chanel, as some images for the Apple App Store must not have transparency.
			if (assetItem.rgba === false) {
				image = image.rgba(false);
			}

			image.write(outputPath);
		}
	}

	private async resize(imagePath: string, width: number, height: number): Promise<Jimp> {
		const image = await Jimp.read(imagePath);
		return image.scaleToFit(width, height);
	}

	private generateImage(background: string, width: number, height: number, outputPath: string, overlayImage?: Jimp): Jimp {
		// Typescript declarations for Jimp are not updated to define the constructor with backgroundColor so we workaround it by casting it to <any> for this case only.
		const J = <any>Jimp;
		const backgroundColor = this.getRgbaNumber(background);
		let image = new J(width, height, backgroundColor);

		if (overlayImage) {
			const centeredWidth = (width - overlayImage.bitmap.width) / 2;
			const centeredHeight = (height - overlayImage.bitmap.height) / 2;
			image = image.composite(overlayImage, centeredWidth, centeredHeight);
		}

		return image;
	}

	private getRgbaNumber(colorString: string): number {
		const color = new Color(colorString);
		const colorRgb = color.rgb();
		const alpha = Math.round(colorRgb.alpha() * 255);

		return Jimp.rgbaToInt(colorRgb.red(), colorRgb.green(), colorRgb.blue(), alpha);
	}
}

$injector.register("assetsGenerationService", AssetsGenerationService);
