export class IOSLogFilter implements Mobile.IPlatformLogFilter {
	// Used to recognize output related to the current project
	// This looks for artifacts like: AppName[22432] or AppName(SomeTextHere)[23123]
	private appOutputRegex: RegExp = /([^\s\(\)]+)(?:\([^\s]+\))?\[[0-9]+\]/;

	// Used to trim the passed messages to a simpler output
	// Example:
	// This: "May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:"
	// Becomes: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:
	protected infoFilterRegex = new RegExp(`^.*(?:<Notice>:|<Error>:|<Warning>:|\\(NativeScript\\)|${this.appOutputRegex.source}:){1}`);

	private filterActive: boolean = true;

	private partialLine: string = null;

	constructor(private $logger: ILogger,
		private $loggingLevels: Mobile.ILoggingLevels) {
	}

	public filterData(data: string, loggingOptions: Mobile.IDeviceLogOptions = <any>{}): string {
		const specifiedLogLevel = (loggingOptions.logLevel || '').toUpperCase();
		this.$logger.trace("Logging options", loggingOptions);

		if (specifiedLogLevel !== this.$loggingLevels.info || !data) {
			return data;
		}

		const chunkLines = data.split('\n');
		const skipLastLine = chunkLines.length > 0 ? data[data.length - 1] !== "\n" : false;
		let output = "";
		for (let i = 0; i < chunkLines.length; i++) {
			let currentLine = chunkLines[i];

			if (this.partialLine) {
				currentLine = this.partialLine + currentLine;
				this.partialLine = undefined;
			}

			if (i === chunkLines.length - 1 && skipLastLine) {
				this.partialLine = currentLine;
				break;
			}

			// Legacy filter moved to preFilter
			if (this.preFilter(data, currentLine)) {
				continue;
			}

			const matchResult = this.appOutputRegex.exec(currentLine);

			if (matchResult && matchResult.length > 1) {
				// Check if the name of the app equals the name of the CLI project and turn on the filter if not.
				// We call initializeProjectData in order to obtain the current project name as the instance
				// of this filter may be used accross multiple projects.
				const projectName = loggingOptions && loggingOptions.projectName;
				this.filterActive = matchResult[1] !== projectName;
			}

			if (this.filterActive) {
				continue;
			}

			const filteredLineInfo = currentLine.match(this.infoFilterRegex);
			if (filteredLineInfo && filteredLineInfo.length > 0) {
				currentLine = currentLine.replace(filteredLineInfo[0], "");
			}

			currentLine = currentLine.trim();
			output += currentLine + '\n';
		}

		return output.length === 0 ? null : output;
	}

	private preFilter(data: string, currentLine: string): boolean {
		return currentLine.length < 1 ||
			currentLine.indexOf("SecTaskCopyDebugDescription") !== -1 ||
			currentLine.indexOf("NativeScript loaded bundle") !== -1 ||
			(currentLine.indexOf("assertion failed:") !== -1 && data.indexOf("libxpc.dylib") !== -1);
	}
}

$injector.register("iOSLogFilter", IOSLogFilter);
