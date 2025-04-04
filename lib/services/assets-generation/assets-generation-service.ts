import JimpModule = require("jimp");
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
		private $options: IOptions,
	) {}

	@exported("assetsGenerationService")
	public async generateIcons(
		resourceGenerationData: IResourceGenerationData,
	): Promise<void> {
		if (this.$options.hostProjectPath) {
			return;
		}

		this.$logger.info("Generating icons ...");
		await this.generateImagesForDefinitions(
			resourceGenerationData,
			this.propertiesToEnumerate.icon,
		);
		this.$logger.info("Icons generation completed.");
	}

	@exported("assetsGenerationService")
	public async generateSplashScreens(
		splashesGenerationData: IResourceGenerationData,
	): Promise<void> {
		this.$logger.info("Generating splash screens ...");
		await this.generateImagesForDefinitions(
			splashesGenerationData,
			this.propertiesToEnumerate.splash,
		);
		this.$logger.info("Splash screens generation completed.");
	}

	private async generateImagesForDefinitions(
		generationData: IResourceGenerationData,
		propertiesToEnumerate: string[],
	): Promise<void> {
		const background = generationData.background || "white";
		const assetsStructure =
			await this.$projectDataService.getAssetsStructure(generationData);

		const assetItems = _(assetsStructure)
			.filter(
				(assetGroup: IAssetGroup, platform: string) =>
					!generationData.platform ||
					platform.toLowerCase() === generationData.platform.toLowerCase(),
			)
			.map((assetGroup: IAssetGroup) =>
				_.filter(
					assetGroup,
					(assetSubGroup: IAssetSubGroup, imageTypeKey: string) =>
						assetSubGroup && propertiesToEnumerate.indexOf(imageTypeKey) !== -1,
				),
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

					const colorHEX: number = JimpModule.cssColorToHex(color);
					const hex = colorHEX?.toString(16).substring(0, 6) ?? "FFFFFF";

					this.$fs.writeFile(
						assetItem.path,
						[
							`<?xml version="1.0" encoding="utf-8"?>`,
							`<resources>`,
							`    <color name="${colorName}">#${hex.toUpperCase()}</color>`,
							`</resources>`,
						].join(EOL),
					);
				} catch (err) {
					this.$logger.info(
						`Failed to write provided color to ${assetItem.path} -> ${colorName}. See --log trace for more info.`,
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
						AssetConstants.sizeDelimiter,
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
					`Image ${assetItem.filename} is skipped as its width and height are invalid.`,
				);
				continue;
			}

			let image: JimpModule.JimpInstance;

			switch (operation) {
				case Operations.OverlayWith:
					const overlayImageScale =
						assetItem.overlayImageScale ||
						AssetConstants.defaultOverlayImageScale;
					const imageResize = Math.round(
						Math.min(width, height) * overlayImageScale,
					);
					image = await this.resize(
						generationData.imagePath,
						imageResize,
						imageResize,
					);
					image = this.generateImage(background, width, height, image);
					break;
				case Operations.Blank:
					image = this.generateImage(background, width, height);
					break;
				case Operations.Resize:
					image = await this.resize(generationData.imagePath, width, height);
					break;
				case Operations.OuterScale:
					// Resize image without applying scale
					image = await this.resize(
						generationData.imagePath,
						assetItem.width,
						assetItem.height,
					);
					// The scale will apply to the underlying layer of the generated image
					image = this.generateImage("#00000000", width, height, image);
					break;
				default:
					throw new Error(`Invalid image generation operation: ${operation}`);
			}

			// This code disables the alpha chanel, as some images for the Apple App Store must not have transparency.
			if (assetItem.rgba === false) {
				// Add an underlying white layer
				image = this.generateImage("#FFFFFF", image.width, image.height, image);
			}

			if (this.isAssetFilePath(outputPath)) {
				image.write(outputPath);
			} else {
				this.$logger.warn(
					`Incorrect destination path ${outputPath} for image ${assetItem.filename}`,
				);
			}
		}
	}

	private async resize(
		imagePath: string,
		width: number,
		height: number,
	): Promise<JimpModule.JimpInstance> {
		const image = await JimpModule.Jimp.read(imagePath);
		return image.scaleToFit({
			w: width,
			h: height,
		}) as JimpModule.JimpInstance;
	}

	private generateImage(
		background: string,
		width: number,
		height: number,
		overlayImage?: JimpModule.JimpInstance,
	): JimpModule.JimpInstance {
		const backgroundColor = this.getRgbaNumber(background);
		let image = new JimpModule.Jimp({
			width,
			height,
			color: backgroundColor,
		});

		if (overlayImage) {
			const centeredWidth = (width - overlayImage.width) / 2;
			const centeredHeight = (height - overlayImage.height) / 2;
			image = image.composite(overlayImage, centeredWidth, centeredHeight);
		}

		return image;
	}

	private getRgbaNumber(colorString: string): number {
		const color = new Color(colorString);
		const colorRgb = color.rgb();
		const alpha = Math.round(colorRgb.alpha() * 255);

		return JimpModule.rgbaToInt(
			colorRgb.red(),
			colorRgb.green(),
			colorRgb.blue(),
			alpha,
		);
	}

	private isAssetFilePath(path: string): path is `${string}.${string}` {
		if (!path) {
			return false;
		}

		const index = path.lastIndexOf(".");
		return index > -1 && index < path.length - 1;
	}
}

injector.register("assetsGenerationService", AssetsGenerationService);
