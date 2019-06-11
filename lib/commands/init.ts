export class ProjectInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public enableHooks = false;

	constructor(private $logger: ILogger,
		private $projectInitService: IProjectInitService) { }

	public async execute(args: string[]): Promise<void> {
		this.$logger.warn("This command is deprecated and it will be removed in the next major release of NativeScript");
		return this.$projectInitService.initialize();
	}
}

$injector.registerCommand("init", ProjectInitCommand);
