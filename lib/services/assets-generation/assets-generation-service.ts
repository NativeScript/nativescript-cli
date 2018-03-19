import * as Jimp from "jimp";
import * as Color from "color";
import { exported } from "../../common/decorators";

export const enum Operations {
	OverlayWith = "overlayWith",
	Blank = "blank",
	Resize = "resize"
}

interface IGenerateImagesData extends ISplashesGenerationData {
	propertiesToEnumerate: string[];
}

export class AssetsGenerationService implements IAssetsGenerationService {
	private get propertiesToEnumerate(): any {
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
		const generationData = (<IGenerateImagesData>resourceGenerationData);
		generationData.propertiesToEnumerate = this.propertiesToEnumerate.icon;
		await this.generateImagesForDefinitions(generationData);
		this.$logger.info("Icons generation completed.");
	}

	@exported("assetsGenerationService")
	public async generateSplashScreens(splashesGenerationData: ISplashesGenerationData): Promise<void> {
		this.$logger.info("Generating splash screens ...");
		const generationData = (<IGenerateImagesData>splashesGenerationData);
		generationData.propertiesToEnumerate = this.propertiesToEnumerate.splash;
		await this.generateImagesForDefinitions(generationData);
		this.$logger.info("Splash screens generation completed.");
	}

	private async generateImagesForDefinitions(data: IGenerateImagesData): Promise<void> {
		data.background = data.background || "white";
		const assetsStructure = await this.$projectDataService.getAssetsStructure({ projectDir: data.projectDir });

		for (const platform in assetsStructure) {
			if (data.platform && platform.toLowerCase() !== data.platform.toLowerCase()) {
				continue;
			}

			const platformAssetsStructure = assetsStructure[platform];

			for (const imageTypeKey in platformAssetsStructure) {
				if (data.propertiesToEnumerate.indexOf(imageTypeKey) === -1 || !platformAssetsStructure[imageTypeKey]) {
					continue;
				}

				const imageType = platformAssetsStructure[imageTypeKey];

				for (const assetItem of imageType.images) {
					if (!assetItem.filename) {
						continue;
					}

					const operation = assetItem.resizeOperation || Operations.Resize;
					const scale = assetItem.scale || 0.8;
					const outputPath = assetItem.path;

					switch (operation) {
						case Operations.OverlayWith:
							const imageResize = Math.round(Math.min(assetItem.width, assetItem.height) * scale);
							const image = await this.resize(data.imagePath, imageResize, imageResize);
							await this.generateImage(data.background, assetItem.width, assetItem.height, outputPath, image);
							break;
						case Operations.Blank:
							await this.generateImage(data.background, assetItem.width, assetItem.height, outputPath);
							break;
						case Operations.Resize:
							const resizedImage = await this.resize(data.imagePath, assetItem.width, assetItem.height);
							resizedImage.write(outputPath);
							break;
						default:
							throw new Error(`Invalid image generation operation: ${operation}`);
					}
				}
			}
		}
	}

	private async resize(imagePath: string, width: number, height: number): Promise<Jimp> {
		const image = await Jimp.read(imagePath);
		return image.scaleToFit(width, height);
	}

	private generateImage(background: string, width: number, height: number, outputPath: string, overlayImage?: Jimp): void {
		// Typescript declarations for Jimp are not updated to define the constructor with backgroundColor so we workaround it by casting it to <any> for this case only.
		const J = <any>Jimp;
		const backgroundColor = this.getRgbaNumber(background);
		let image = new J(width, height, backgroundColor);

		if (overlayImage) {
			const centeredWidth = (width - overlayImage.bitmap.width) / 2;
			const centeredHeight = (height - overlayImage.bitmap.height) / 2;
			image = image.composite(overlayImage, centeredWidth, centeredHeight);
		}

		image.write(outputPath);
	}

	private getRgbaNumber(colorString: string): number {
		const color = new Color(colorString);
		const colorRgb = color.rgb();
		const alpha = Math.round(colorRgb.alpha() * 255);

		return Jimp.rgbaToInt(colorRgb.red(), colorRgb.green(), colorRgb.blue(), alpha);
	}
}

$injector.register("assetsGenerationService", AssetsGenerationService);
