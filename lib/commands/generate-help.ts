export class GenerateHelpCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $htmlHelpService: IHtmlHelpService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$htmlHelpService.generateHtmlPages();
	}
}

$injector.registerCommand("dev-generate-help", GenerateHelpCommand);
