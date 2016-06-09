export class InfoCommand implements ICommand {
	constructor(private $infoService: IInfoService) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$infoService.printComponentsInfo();
	}
}
$injector.registerCommand("info", InfoCommand);
