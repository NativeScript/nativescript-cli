export class SetupCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $doctorService: IDoctorService) { }

	public async execute(args: string[]): Promise<any> {
		return this.$doctorService.runSetupScript();
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}
$injector.registerCommand("setup", SetupCommand);

export class CloudSetupCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $extensibilityService: IExtensibilityService) { }

	public async execute(args: string[]): Promise<any> {
		const installedExtensions = this.$extensibilityService.getInstalledExtensions();
		if (!installedExtensions["nativescript-cloud"]) {
			return this.$extensibilityService.installExtension("nativescript-cloud");
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}
$injector.registerCommand("cloud|setup", CloudSetupCommand);
