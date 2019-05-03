export class ProjectInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public enableHooks = false;

	constructor(private $projectInitService: IProjectInitService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$projectInitService.initialize();
	}
}

$injector.registerCommand("init", ProjectInitCommand);
