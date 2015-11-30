///<reference path="../.d.ts"/>
"use strict";

export class DeviceLogProvider implements Mobile.IDeviceLogProvider {
	//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
	private static LINE_REGEX = /.\/(.+?)\s*\(\s*\d+?\): (.*)/;
	// sample line is "11-23 12:39:07.310  1584  1597 I art     : Background sticky concurrent mark sweep GC freed 21966(1780KB) AllocSpace objects, 4(80KB) LOS objects, 77% free, 840KB/3MB, paused 4.018ms total 158.629ms"
	private static API_LEVEL_23_LINE_REGEX = /.+?\s+?(?:[A-Z]\s+?)([A-Za-z ]+?)\s+?\: (.*)/;

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
		let match = lineText.match(DeviceLogProvider.LINE_REGEX) || lineText.match(DeviceLogProvider.API_LEVEL_23_LINE_REGEX);
		if (match && acceptedTags.indexOf(match[1].trim()) !== -1) {
			return {tag: match[1].trim(), message: match[2]};
		}
		let matchingTag = _.any(acceptedTags, (tag: string) => { return lineText.indexOf(tag) !== -1; });
		return matchingTag ? { message: lineText } : null;
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
