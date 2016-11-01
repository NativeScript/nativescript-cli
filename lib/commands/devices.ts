export class DevicesCommand implements ICommand {

	constructor(private $stringParameter: ICommandParameter) {}

	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return $injector.resolveCommand("device").execute(args);
	}
}
$injector.registerCommand("devices", DevicesCommand);
