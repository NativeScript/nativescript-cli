import * as path from "path";
import * as Jimp from "jimp";
import * as Color from "color";
import { Icons, SplashScreens, Operations } from "./image-definitions"

export class AssetsGenerationService implements IAssetsGenerationService {
	constructor(private $logger: ILogger) {	
	}
	
	public async generateIcons(imagePath: string, resourcesPath: string): Promise<void> {
		this.$logger.info("Generating icons ...");
		await this.generateImagesForDefinitions(imagePath, resourcesPath, Icons)
		this.$logger.info("Icons generation completed.");
	}

	public async generateSplashScreens(imagePath: string, resourcesPath: string, background?: string): Promise<void> {
		this.$logger.info("Generating splash screens ...");
		await this.generateImagesForDefinitions(imagePath, resourcesPath, SplashScreens, background)
		this.$logger.info("Splash screens generation completed.");
	}

	private async generateImagesForDefinitions(imagePath: string, resourcesPath: string, definitions: any[], background: string = "white") : Promise<void> {
		for (let definition of definitions) {
			const operation = definition.operation || Operations.Resize;
			const scale = definition.scale || 0.8;
			const outputPath = this.convertToAbsolutePath(resourcesPath, definition.path);

			switch (operation) {
				case Operations.OverlayWith:
					const imageResize = Math.round(Math.min(definition.width, definition.height) * scale);
					const image = await this.resize(imagePath, imageResize, imageResize);
					await this.generateImage(background, definition.width, definition.height, outputPath, image);
					break;
				case Operations.Blank:
					await this.generateImage(background, definition.width, definition.height, outputPath);
					break;
				case Operations.Resize:
					const resizedImage = await this.resize(imagePath, definition.width, definition.height);
					resizedImage.write(outputPath);
					break;
				default:
					throw new Error(`Invalid image generation operation: ${operation}`);
			}
		}
	}

	private async resize(imagePath: string, width: number, height: number) {
		const image = await Jimp.read(imagePath);
		return image.scaleToFit(width, height);
	}

	private generateImage(background: string, width: number, height: number, outputPath: string, overlayImage?: Jimp) {
		//Typescript declarations for Jimp are not updated to define the constructor with backgroundColor so we workaround it by casting it to <any> for this case only.
		let J = <any>Jimp;
		const backgroundColor = this.getRgbaNumber(background);
		let image = new J(width, height, backgroundColor);

		if (overlayImage) {
			const centeredWidth = (width - overlayImage.bitmap.width) / 2;
			const centeredHeight = (height - overlayImage.bitmap.height) / 2;
			image = image.composite(overlayImage, centeredWidth, centeredHeight);
		}

		image.write(outputPath)
	}

	private convertToAbsolutePath(resourcesPath: string, resourcePath: string) {
		return path.isAbsolute(resourcePath) ? resourcePath : path.join(resourcesPath, resourcePath);
	}

	private getRgbaNumber(colorString: string) : number {
		const color = new Color(colorString);
		const colorRgb = color.rgb();
		const alpha = Math.round(colorRgb.alpha() * 255);

		return Jimp.rgbaToInt(colorRgb.red(), colorRgb.green(), colorRgb.blue(), alpha);
	}
}

$injector.register("assetsGenerationService", AssetsGenerationService);