import {
	CommandContext,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import {
	IAssetsGenerationService,
	IResourceGenerationData,
} from "../declarations";
import { IProjectData } from "../definitions/project";
import { inject } from "../common/di";

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

const generateAssetsCommandOptions = {
	background: stringOption(),
} satisfies CommandOptionsSchema;

function runGenerateAssetsCommand(
	context: CommandContext<typeof generateAssetsCommandOptions>,
	assets: GeneratedAssets,
): Promise<void> {
	const $assetsGenerationService =
		context.injector.get<IAssetsGenerationService>("assetsGenerationService");
	const $projectData = context.injector.get<IProjectData>("projectData");
	return generators[assets]($assetsGenerationService, {
		imagePath: context.args[0],
		background: context.options.background,
		projectDir: $projectData.projectDir,
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
		// In setup, not run: it lands ahead of the arguments policy, so being
		// outside a project is what a missing image path reports first.
		setup(): void {
			inject<IProjectData>("projectData").initializeProjectData();
		},
		run: (context) => runGenerateAssetsCommand(context, assets),
	});

export const generateIconsCommand = defineGenerateAssetsCommand(
	"resources|generate|icons",
	"icons",
);

export const generateSplashesCommand = defineGenerateAssetsCommand(
	"resources|generate|splashes",
	"splashes",
);
