import {
	CommandContext,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import {
	IAssetsGenerationService,
	IResourceGenerationData,
} from "../declarations";
import { IProjectData } from "../definitions/project";

/** Which set of assets a command generates from the source image. */
type GeneratedAssets = "icons" | "splashes";

const generators: Record<
	GeneratedAssets,
	(
		service: IAssetsGenerationService,
		data: IResourceGenerationData,
	) => Promise<void>
> = {
	icons: (service, data) => service.generateIcons(data),
	splashes: (service, data) => service.generateSplashScreens(data),
};

export const generateAssetsCommandOptions = {
	background: stringOption(),
} satisfies CommandOptionsSchema;

export type GenerateAssetsCommandContext = CommandContext<
	typeof generateAssetsCommandOptions
>;

export function setupGenerateAssetsCommand(assets: GeneratedAssets) {
	const services = {
		assets,
		$assetsGenerationService: inject<IAssetsGenerationService>(
			"assetsGenerationService",
		),
		$projectData: inject<IProjectData>("projectData"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IGenerateAssetsCommandServices = ReturnType<
	typeof setupGenerateAssetsCommand
>;

export function runGenerateAssetsCommand(
	context: GenerateAssetsCommandContext,
	services: IGenerateAssetsCommandServices,
): Promise<void> {
	return generators[services.assets](services.$assetsGenerationService, {
		imagePath: context.args[0],
		background: context.options.background,
		projectDir: services.$projectData.projectDir,
	});
}

const defineGenerateAssetsCommand = <const TName extends CommandName>(
	name: TName,
	assets: GeneratedAssets,
) =>
	defineCommand({
		name,
		description:
			"Generates icons and splash screens based on the provided image.",
		options: generateAssetsCommandOptions,
		arguments: [
			{
				name: "imagePath",
				required: true,
				errorMessage:
					"You have to provide path to image to generate other images based on it.",
			},
		],
		setup: () => setupGenerateAssetsCommand(assets),
		run: runGenerateAssetsCommand,
	});

export const generateIconsCommand = defineGenerateAssetsCommand(
	"resources|generate|icons",
	"icons",
);

export const generateSplashesCommand = defineGenerateAssetsCommand(
	"resources|generate|splashes",
	"splashes",
);
