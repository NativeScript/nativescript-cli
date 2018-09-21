export class GetFileCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $stringParameter: ICommandParameter,
		private $project: Project.IProjectBase,
		private $errors: IErrors,
		private $options: ICommonOptions) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter, this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });
		let appIdentifier = args[1];

		if (!appIdentifier && !this.$project.projectData) {
			this.$errors.failWithoutHelp("Please enter application identifier or execute this command in project.");
		}

		appIdentifier = appIdentifier || this.$project.projectData.AppIdentifier;

		const action = (device: Mobile.IDevice) => device.fileSystem.getFile(args[0], appIdentifier, this.$options.file);
		await this.$devicesService.execute(action);
	}
}

$injector.registerCommand(["device|get-file", "devices|get-file"], GetFileCommand);
