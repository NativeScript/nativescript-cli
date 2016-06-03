export class GenerateHelpCommand implements ICommand {
	constructor(private $htmlHelpService: IHtmlHelpService) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$htmlHelpService.generateHtmlPages();
	}
}
$injector.registerCommand("dev-generate-help", GenerateHelpCommand);
