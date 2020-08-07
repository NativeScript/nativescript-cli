import { IAssetsGenerationService, IOptions } from "../declarations";
import { IProjectData } from "../definitions/project";

import { ICommand, ICommandParameter, IStringParameterBuilder } from "../common/definitions/commands";

export abstract class GenerateCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("You have to provide path to image to generate other images based on it.")];

	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		protected $stringParameterBuilder: IStringParameterBuilder,
		protected $assetsGenerationService: IAssetsGenerationService) {
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const [ imagePath ] = args;
		await this.generate(imagePath, this.$options.background);
	}

	protected abstract generate(imagePath: string, background?: string): Promise<void>;
}

export class GenerateIconsCommand extends GenerateCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		protected $stringParameterBuilder: IStringParameterBuilder,
		$assetsGenerationService: IAssetsGenerationService) {
			super($options, $projectData, $stringParameterBuilder, $assetsGenerationService);
	}

	protected async generate(imagePath: string, background?: string): Promise<void> {
		await this.$assetsGenerationService.generateIcons({ imagePath, projectDir: this.$projectData.projectDir });
	}
}

$injector.registerCommand("resources|generate|icons", GenerateIconsCommand);

export class GenerateSplashScreensCommand extends GenerateCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		protected $stringParameterBuilder: IStringParameterBuilder,
		$assetsGenerationService: IAssetsGenerationService) {
			super($options, $projectData, $stringParameterBuilder, $assetsGenerationService);
	}

	protected async generate(imagePath: string, background?: string): Promise<void> {
		await this.$assetsGenerationService.generateSplashScreens({ imagePath, background, projectDir: this.$projectData.projectDir });
	}
}

$injector.registerCommand("resources|generate|splashes", GenerateSplashScreensCommand);
