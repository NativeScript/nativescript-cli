///<reference path="../.d.ts"/>
"use strict";

export class DeviceLogProvider implements Mobile.IDeviceLogProvider {
	//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
	private static LINE_REGEX = /.\/(.+?)\s*\(\s*(\d+?)\): (.*)/;

	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger) { }

	public logData(lineText: string, platform: string, deviceIdentifier: string): void {
		if (!platform || platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			this.$logger.out(lineText);
		} else if (platform === this.$devicePlatformsConstants.Android) {
			let log = this.getConsoleLogFromLine(lineText);
			if (log) {
				if (log.tag) {
					this.$logger.out(`${log.tag}: ${log.message}`);
				} else {
					this.$logger.out(log.message);
				}
			}
		}
	}

	private getConsoleLogFromLine(lineText: String): any {
		let acceptedTags = ["chromium", "Web Console", "JS"];
		let match = lineText.match(DeviceLogProvider.LINE_REGEX);
		if (match) {
			if(acceptedTags.indexOf(match[1]) !== -1) {
				return {tag: match[1], message: match[3]};
			}
		} else if (_.any(acceptedTags, (tag: string) => { return lineText.indexOf(tag) !== -1; })) {
			return {message: match[3]};
		}
		return null;
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
