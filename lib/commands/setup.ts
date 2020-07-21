export class SetupCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $doctorService: IDoctorService) { }

	public execute(args: string[]): Promise<any> {
		return this.$doctorService.runSetupScript();
	}
}
$injector.registerCommand("setup|*", SetupCommand);

export class CloudSetupCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $nativeScriptCloudExtensionService: INativeScriptCloudExtensionService) { }

	public execute(args: string[]): Promise<any> {
		return this.$nativeScriptCloudExtensionService.install();
	}
}
$injector.registerCommand("cloud|setup", CloudSetupCommand);
