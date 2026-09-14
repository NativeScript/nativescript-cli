import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject, InjectionToken } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";
import { getInjector } from "../common/yok";
import {
	IAssetsGenerationService,
	IResourceGenerationData,
} from "../declarations";
import { IProjectData } from "../definitions/project";

/** Which set of assets a registration generates from the source image. */
type GeneratedAssets = "icons" | "splashes";

const GENERATED_ASSETS = new InjectionToken<GeneratedAssets>("generatedAssets");

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

export interface IGenerateAssetsCommandServices {
	assets: GeneratedAssets;
	$assetsGenerationService: IAssetsGenerationService;
	$projectData: IProjectData;
}

export function setupGenerateAssetsCommand(): IGenerateAssetsCommandServices {
	const services = {
		assets: inject(GENERATED_ASSETS),
		$assetsGenerationService: inject<IAssetsGenerationService>(
			"assetsGenerationService",
		),
		$projectData: inject<IProjectData>("projectData"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

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

export const generateAssetsCommandDefinition = defineCommand({
	name: "resources|generate|icons",
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
	setup: setupGenerateAssetsCommand,
	run: runGenerateAssetsCommand,
});

const generateAssetsCommands: [string, GeneratedAssets][] = [
	["resources|generate|icons", "icons"],
	["resources|generate|splashes", "splashes"],
];

for (const [name, assets] of generateAssetsCommands) {
	registerCommand(
		{ ...generateAssetsCommandDefinition, name },
		getInjector().createChild([
			{ provide: GENERATED_ASSETS, useValue: assets },
		]),
	);
}
