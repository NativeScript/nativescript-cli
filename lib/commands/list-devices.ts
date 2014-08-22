///<reference path="../.d.ts"/>
import helpers = require("./../common/helpers");
import util = require("util")

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
				private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var index = 1;
			this.$devicesServices.initialize(args[0], null, {skipInferPlatform: true}).wait();

			var action = (device: Mobile.IDevice) => {
				return (() => { this.$logger.out("#%d: '%s'", (index++).toString(), device.getDisplayName(), device.getPlatform(), device.getIdentifier()); }).future<void>()();
			};
			this.$devicesServices.execute(action, undefined, {allowNoDevices: true}).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("list-devices", ListDevicesCommand);
