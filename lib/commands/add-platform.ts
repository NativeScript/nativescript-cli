import { ValidatePlatformCommandBase } from "./command-base";

export class AddPlatformCommand extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($options: IOptions,
		$platformService: IPlatformService,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		private $errors: IErrors) {
			super($options, $platformsData, $platformService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.addPlatforms(args, this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
	}

	public async canExecute(args: string[]): Promise<ICanExecuteCommandOutput> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to add");
		}

		let canExecute = true;
		for (const arg of args) {
			this.$platformService.validatePlatform(arg, this.$projectData);
			const output = await super.canExecuteCommandBase(arg);
			canExecute = canExecute && output.canExecute;
		}

		return {
			canExecute,
			suppressCommandHelp: !canExecute
		};
	}
}

$injector.registerCommand("platform|add", AddPlatformCommand);
