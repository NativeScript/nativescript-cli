export class OpenDeviceLogStreamCommand implements ICommand {
	private static NOT_SPECIFIED_DEVICE_ERROR_MESSAGE = "More than one device found. Specify device explicitly.";

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $commandsService: ICommandsService,
		private $options: IOptions,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $loggingLevels: Mobile.ILoggingLevels,
		$iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		$cleanupService: ICleanupService) {
		$iOSSimulatorLogProvider.setShouldDispose(false);
		$cleanupService.setShouldDispose(false);
	}

	allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		this.$deviceLogProvider.setLogLevel(this.$loggingLevels.full);

		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });

		if (this.$devicesService.deviceCount > 1) {
			await this.$commandsService.tryExecuteCommand("device", []);
			this.$errors.failWithHelp(OpenDeviceLogStreamCommand.NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
		}

		const action = (device: Mobile.IiOSDevice) => device.openDeviceLogStream();
		await this.$devicesService.execute(action);
	}
}

$injector.registerCommand(["device|log", "devices|log"], OpenDeviceLogStreamCommand);
