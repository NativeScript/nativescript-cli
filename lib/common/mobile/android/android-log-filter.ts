import { injector } from "../../yok";
import { EOL } from "os";

export class AndroidLogFilter implements Mobile.IPlatformLogFilter {
	//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
	private static LINE_REGEX = /.\/(.+?)\s*\(\s*\d+?\): (.*)/;

	// sample line is "11-23 12:39:07.310  1584  1597 I art     : Background sticky concurrent mark sweep GC freed 21966(1780KB) AllocSpace objects, 4(80KB) LOS objects, 77% free, 840KB/3MB, paused 4.018ms total 158.629ms"
	// or '12-28 10:45:08.020  3329  3329 W chromium: [WARNING:data_reduction_proxy_settings.cc(328)] SPDY proxy OFF at startup'
	private static API_LEVEL_23_LINE_REGEX =
		/.+?\s+?(?:[A-Z]\s+?)([A-Za-z \.]+?)\s*?\: (.*)/;

	constructor(private $loggingLevels: Mobile.ILoggingLevels) {}

	public filterData(
		data: string,
		loggingOptions: Mobile.IDeviceLogOptions = <any>{}
	): string {
		const specifiedLogLevel = (loggingOptions.logLevel || "").toUpperCase();
		if (specifiedLogLevel === this.$loggingLevels.info) {
			const log = this.getConsoleLogFromLine(
				data,
				loggingOptions.applicationPid
			);
			if (log) {
				if (log.tag) {
					return (
						`${log.tag === "JS" ? "" : `${log.tag}: `}${log.message}` + EOL
					);
				} else {
					return log.message + EOL;
				}
			}

			return null;
		}

		return data + EOL;
	}

	getConsoleLogFromLine(lineText: string, pid: string) {
		if (pid && lineText.indexOf(pid) === -1) {
			return null;
		}

		let consoleLogMessage;
		const match =
			lineText.match(AndroidLogFilter.LINE_REGEX) ||
			lineText.match(AndroidLogFilter.API_LEVEL_23_LINE_REGEX);
		if (match) {
			consoleLogMessage = { tag: match[1].trim(), message: match[2] };
		}
		return consoleLogMessage;
	}
}
injector.register("androidLogFilter", AndroidLogFilter);
