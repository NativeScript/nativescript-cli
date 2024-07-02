import * as Jimp from "jimp";
import * as Color from "color";
import { exported } from "../../common/decorators";
import { AssetConstants } from "../../constants";
import {
	IAssetsGenerationService,
	IOptions,
	IResourceGenerationData,
} from "../../declarations";
import {
	IProjectDataService,
	IAssetGroup,
	IAssetSubGroup,
} from "../../definitions/project";
import { IDictionary, IFileSystem } from "../../common/declarations";
import * as _ from "lodash";
import { injector } from "../../common/yok";
import { EOL } from "os";

export const enum Operations {
	OverlayWith = "overlayWith",
	Blank = "blank",
	Resize = "resize",
	OuterScale = "outerScale",
}

export class AssetsGenerationService implements IAssetsGenerationService {
	private get propertiesToEnumerate(): IDictionary<string[]> {
		return {
			icon: ["icons"],
			splash: ["splashBackgrounds", "splashCenterImages", "splashImages"],
		};
	}

	constructor(
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $fs: IFileSystem,
		private $options: IOptions
	) {}

	@exported("assetsGenerationService")
	public async generateIcons(
		resourceGenerationData: IResourceGenerationData
	): Promise<void> {
		if (this.$options.hostProjectPath) {
			return;
		}

		this.$logger.info("Generating icons ...");
		await this.generateImagesForDefinitions(
			resourceGenerationData,
			this.propertiesToEnumerate.icon
		);
		this.$logger.info("Icons generation completed.");
	}

	@exported("assetsGenerationService")
	public async generateSplashScreens(
		splashesGenerationData: IResourceGenerationData
	): Promise<void> {
		this.$logger.info("Generating splash screens ...");
		await this.generateImagesForDefinitions(
			splashesGenerationData,
			this.propertiesToEnumerate.splash
		);
		this.$logger.info("Splash screens generation completed.");
	}

	private async generateImagesForDefinitions(
		generationData: IResourceGenerationData,
		propertiesToEnumerate: string[]
	): Promise<void> {
		const background = generationData.background || "white";
		const assetsStructure = await this.$projectDataService.getAssetsStructure(
			generationData
		);

		const assetItems = _(assetsStructure)
			.filter(
				(assetGroup: IAssetGroup, platform: string) =>
					!generationData.platform ||
					platform.toLowerCase() === generationData.platform.toLowerCase()
			)
			.map((assetGroup: IAssetGroup) =>
				_.filter(
					assetGroup,
					(assetSubGroup: IAssetSubGroup, imageTypeKey: string) =>
						assetSubGroup && propertiesToEnumerate.indexOf(imageTypeKey) !== -1
				)
			)
			.flatten()
			.map((assetSubGroup: IAssetSubGroup) => assetSubGroup.images)
			.flatten()
			.filter((assetItem: any) => !!assetItem.filename)
			.value();

		for (const assetItem of assetItems) {
			if (assetItem.operation === "delete") {
				if (this.$fs.exists(assetItem.path)) {
					this.$fs.deleteFile(assetItem.path);
				}
				continue;
			}

			if (assetItem.operation === "writeXMLColor") {
				const colorName = assetItem.data?.colorName;
				if (!colorName) {
					continue;
				}
				try {
					const color =
						(generationData as any)[assetItem.data?.fromKey] ??
						assetItem.data?.default ??
						"white";

					const colorHEX: number = Jimp.cssColorToHex(color);
					const hex = colorHEX?.toString(16).substring(0, 6) ?? "FFFFFF";

					this.$fs.writeFile(
						assetItem.path,
						[
							`<?xml version="1.0" encoding="utf-8"?>`,
							`<resources>`,
							`    <color name="${colorName}">#${hex.toUpperCase()}</color>`,
							`</resources>`,
						].join(EOL)
					);
				} catch (err) {
					this.$logger.info(
						`Failed to write provided color to ${assetItem.path} -> ${colorName}. See --log trace for more info.`
					);
					this.$logger.trace(err);
				}
				continue;
			}

			const operation = assetItem.resizeOperation || Operations.Resize;
			let tempScale: number = null;
			if (assetItem.scale) {
				if (_.isNumber(assetItem.scale)) {
					tempScale = assetItem.scale;
				} else {
					const splittedElements = `${assetItem.scale}`.split(
						AssetConstants.sizeDelimiter
					);
					tempScale =
						splittedElements &&
						splittedElements.length &&
						splittedElements[0] &&
						+splittedElements[0];
				}
			}

			const scale = tempScale || AssetConstants.defaultScale;

			const outputPath = assetItem.path;
			const width = assetItem.width * scale;
			const height = assetItem.height * scale;

			if (!width || !height) {
				this.$logger.warn(
					`Image ${assetItem.filename} is skipped as its width and height are invalid.`
				);
				continue;
			}

			let image: Jimp;
			switch (operation) {
				case Operations.OverlayWith:
					const overlayImageScale =
						assetItem.overlayImageScale ||
						AssetConstants.defaultOverlayImageScale;
					const imageResize = Math.round(
						Math.min(width, height) * overlayImageScale
					);
					image = await this.resize(
						generationData.imagePath,
						imageResize,
						imageResize
					);
					image = this.generateImage(
						background,
						width,
						height,
						outputPath,
						image
					);
					break;
				case Operations.Blank:
					image = this.generateImage(background, width, height, outputPath);
					break;
				case Operations.Resize:
					image = await this.resize(generationData.imagePath, width, height);
					break;
				case Operations.OuterScale:
					// Resize image without applying scale
					image = await this.resize(
						generationData.imagePath,
						assetItem.width,
						assetItem.height
					);
					// The scale will apply to the underlying layer of the generated image
					image = this.generateImage(
						"#00000000",
						width,
						height,
						outputPath,
						image
					);
					break;
				default:
					throw new Error(`Invalid image generation operation: ${operation}`);
			}

			// This code disables the alpha chanel, as some images for the Apple App Store must not have transparency.
			if (assetItem.rgba === false) {
				//
				// The original code here became broken at some time and there is an issue posted here..
				//    https://github.com/oliver-moran/jimp/issues/954
				// But NathanaelA recommended the below change and it works so maybe that's just what we go with.
				//
				// image = image.rgba(false);
				image = image.colorType(2);
			}

			image.write(outputPath);
		}
	}

	private async resize(
		imagePath: string,
		width: number,
		height: number
	): Promise<Jimp> {
		const image = await Jimp.read(imagePath);
		return image.scaleToFit(width, height);
	}

	private generateImage(
		background: string,
		width: number,
		height: number,
		outputPath: string,
		overlayImage?: Jimp
	): Jimp {
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

		return Jimp.rgbaToInt(
			colorRgb.red(),
			colorRgb.green(),
			colorRgb.blue(),
			alpha
		);
	}
}

injector.register("assetsGenerationService", AssetsGenerationService);
