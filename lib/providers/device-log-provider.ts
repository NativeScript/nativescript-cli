///<reference path="../.d.ts"/>
"use strict";

export class DeviceLogProvider implements Mobile.IDeviceLogProvider {
	constructor(private $logger: ILogger) { }

	public logData(line: string, platform: string, deviceIdentifier: string): void {
		this.$logger.out(line);
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
