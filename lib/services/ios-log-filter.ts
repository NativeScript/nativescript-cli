export class IOSLogFilter implements Mobile.IPlatformLogFilter {

	constructor(private $loggingLevels: Mobile.ILoggingLevels) { }

	public filterData(data: string, logLevel: string, pid?: string): string {

		if (pid && data && data.indexOf(`[${pid}]`) === -1) {
			return null;
		}

		if (data) {
			if (data.indexOf("SecTaskCopyDebugDescription") !== -1 ||
				data.indexOf("NativeScript loaded bundle") !== -1 ||
			    (data.indexOf("assertion failed:") !== -1 && data.indexOf("libxpc.dylib") !== -1)) {
				return null;
			}
			// CONSOLE LOG messages comme in the following form:
			// <date> <domain> <app>[pid] CONSOLE LOG file:///location:row:column: <actual message goes here>
			// This code removes the first part and leaves only the message as specified by the call to console.log function.
			// This removes the unnecessary information and makes the log consistent with Android.
			let logIndex = data.indexOf("CONSOLE LOG");
			if (logIndex !== -1) {
			 	let i = 4;
			 	while(i) { logIndex = data.indexOf(':', logIndex+1); i --; }
			 	if (logIndex > 0) {
			 		data = "JS:" + data.substring(logIndex+1, data.length);
				}
			}
			return data.trim();
		}

		return data;
	}
}
$injector.register("iOSLogFilter", IOSLogFilter);
