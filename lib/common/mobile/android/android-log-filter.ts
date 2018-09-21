const os = require("os");

export class AndroidLogFilter implements Mobile.IPlatformLogFilter {

	//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
	private static LINE_REGEX = /.\/(.+?)\s*\(\s*\d+?\): (.*)/;

	// sample line is "11-23 12:39:07.310  1584  1597 I art     : Background sticky concurrent mark sweep GC freed 21966(1780KB) AllocSpace objects, 4(80KB) LOS objects, 77% free, 840KB/3MB, paused 4.018ms total 158.629ms"
	// or '12-28 10:45:08.020  3329  3329 W chromium: [WARNING:data_reduction_proxy_settings.cc(328)] SPDY proxy OFF at startup'
	private static API_LEVEL_23_LINE_REGEX = /.+?\s+?(?:[A-Z]\s+?)([A-Za-z \.]+?)\s*?\: (.*)/;

	constructor(private $loggingLevels: Mobile.ILoggingLevels) { }

	public filterData(data: string, loggingOptions: Mobile.IDeviceLogOptions = <any>{}): string {
		const specifiedLogLevel = (loggingOptions.logLevel || '').toUpperCase();
		if (specifiedLogLevel === this.$loggingLevels.info) {
			const log = this.getConsoleLogFromLine(data, loggingOptions.applicationPid);
			if (log) {
				if (log.tag) {
					return `${log.tag}: ${log.message}` + os.EOL;
				} else {
					return log.message + os.EOL;
				}
			}

			return null;
		}

		return data + os.EOL;
	}

	private getConsoleLogFromLine(lineText: string, pid: string): any {
		// filter log line if it does not belong to the current application process id
		if (pid && lineText.indexOf(pid) < 0) {
			return null;
		}

		const acceptedTags = ["chromium", "Web Console", "JS", "ActivityManager", "System.err"];

		let consoleLogMessage: { tag?: string, message: string };

		const match = lineText.match(AndroidLogFilter.LINE_REGEX) || lineText.match(AndroidLogFilter.API_LEVEL_23_LINE_REGEX);

		if (match && acceptedTags.indexOf(match[1].trim()) !== -1) {
			consoleLogMessage = { tag: match[1].trim(), message: match[2] };
		}

		if (!consoleLogMessage) {
			const matchingTag = _.some(acceptedTags, (tag: string) => { return lineText.indexOf(tag) !== -1; });
			consoleLogMessage = matchingTag ? { message: lineText } : null;
		}

		return consoleLogMessage;
	}
}
$injector.register("androidLogFilter", AndroidLogFilter);
