export class PostInstallCommand implements ICommand {
	constructor(protected $errors: IErrors) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$errors.failWithoutHelp("This command is deprecated. Use `tns dev-post-install-cli` instead");
	}
}
$injector.registerCommand("dev-post-install", PostInstallCommand);
