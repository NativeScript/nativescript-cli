import { IOptions } from "../../../declarations";
import { injector } from "../../yok";
import { ICommandParameter, ICommand } from "../../definitions/commands";

export class StopApplicationOnDeviceCommand implements ICommand {

	constructor(private $devicesService: Mobile.IDevicesService,
		private $stringParameter: ICommandParameter,
		private $options: IOptions) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameter, this.$stringParameter, this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true, platform: args[1] });

		const action = (device: Mobile.IDevice) => device.applicationManager.stopApplication({ appId: args[0], projectName: args[2], projectDir: null });
		await this.$devicesService.execute(action);
	}
}

injector.registerCommand(["device|stop", "devices|stop"], StopApplicationOnDeviceCommand);
