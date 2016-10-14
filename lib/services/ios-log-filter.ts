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
			// This code removes unnecessary information from log messages. The output looks like: 
			// CONSOLE LOG file:///location:row:column: <actual message goes here>			
			if (pid) {
				let searchString = "["+pid+"]: ";
				let pidIndex = data.indexOf(searchString);
				if (pidIndex > 0) {
					data = data.substring(pidIndex + searchString.length, data.length);
				}
			}
			return data.trim();
		}

		return data;
	}
}
$injector.register("iOSLogFilter", IOSLogFilter);
