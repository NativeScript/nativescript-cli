export class DevicesCommand implements ICommand {

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return $injector.resolveCommand("device").execute(args);
	}
}
$injector.registerCommand("devices", DevicesCommand);
