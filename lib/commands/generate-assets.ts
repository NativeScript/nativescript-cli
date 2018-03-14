import { StringCommandParameter } from "../common/command-params";

export abstract class GenerateCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector)];

	constructor(protected $options: IOptions,
		protected $injector: IInjector,
		protected $projectData: IProjectData,
		protected $assetsGenerationService: IAssetsGenerationService) {
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const [ imagePath ] = args;
		const resourcesPath = this.$projectData.getAppResourcesDirectoryPath();
		await this.generate(imagePath, resourcesPath, this.$options.background);
	}

	protected abstract generate(imagePath: string, resourcesPath: string, background?: string): Promise<void>;
}

export class GenerateIconsCommand extends GenerateCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		$injector: IInjector,
		$projectData: IProjectData,
		$assetsGenerationService: IAssetsGenerationService) {
			super($options, $injector, $projectData, $assetsGenerationService);
	}

	protected async generate(imagePath: string, resourcesPath: string, background?: string): Promise<void> {
		await this.$assetsGenerationService.generateIcons({ imagePath, resourcesPath });
	}
}

$injector.registerCommand("resources|generate|icons", GenerateIconsCommand);

export class GenerateSplashScreensCommand extends GenerateCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		$injector: IInjector,
		$projectData: IProjectData,
		$assetsGenerationService: IAssetsGenerationService) {
			super($options, $injector, $projectData, $assetsGenerationService);
	}

	protected async generate(imagePath: string, resourcesPath: string, background?: string): Promise<void> {
		await this.$assetsGenerationService.generateSplashScreens({ imagePath, resourcesPath, background });
	}
}

$injector.registerCommand("resources|generate|splashes", GenerateSplashScreensCommand);