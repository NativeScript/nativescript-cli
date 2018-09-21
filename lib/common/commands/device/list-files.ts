export class ListFilesCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $stringParameter: ICommandParameter,
		private $options: ICommonOptions,
		private $project: Project.IProjectBase,
		private $errors: IErrors) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter, this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });
		const pathToList = args[0];
		let appIdentifier = args[1];

		if (!appIdentifier && !this.$project.projectData) {
			this.$errors.failWithoutHelp("Please enter application identifier or execute this command in project.");
		}

		appIdentifier = appIdentifier || this.$project.projectData.AppIdentifier;

		const action = (device: Mobile.IDevice) => device.fileSystem.listFiles(pathToList, appIdentifier);
		await this.$devicesService.execute(action);
	}
}

$injector.registerCommand(["device|list-files", "devices|list-files"], ListFilesCommand);
