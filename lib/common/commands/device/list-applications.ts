import { EOL } from "os";
import * as util from "util";

export class ListApplicationsCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $logger: ILogger,
		private $options: ICommonOptions) { }

	allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });
		const output: string[] = [];

		const action = async (device: Mobile.IDevice) => {
			const applications = await device.applicationManager.getInstalledApplications();
			output.push(util.format("%s=====Installed applications on device with UDID '%s' are:", EOL, device.deviceInfo.identifier));
			_.each(applications, (applicationId: string) => output.push(applicationId));
		};
		await this.$devicesService.execute(action);

		this.$logger.out(output.join(EOL));
	}
}
$injector.registerCommand(["device|list-applications", "devices|list-applications"], ListApplicationsCommand);
