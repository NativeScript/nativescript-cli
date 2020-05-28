export class SetupCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $doctorService: IDoctorService) { }

	public execute(args: string[]): Promise<any> {
		return this.$doctorService.runSetupScript();
	}
}
$injector.registerCommand("setup|*", SetupCommand);
