let sourcemap = require("source-map");
import * as path from "path";

export class IOSLogFilter implements Mobile.IPlatformLogFilter {

	constructor(
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $loggingLevels: Mobile.ILoggingLevels) { }

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
					data = this.getOriginalFileLocation(data);
				}
			}
			return data.trim();
		}

		return data;
	}

	private getOriginalFileLocation(data: string): string {
		let fileString = "file:///";
		let fileIndex = data.indexOf(fileString);
		if (fileIndex >= 0) {
			let parts = data.substring(fileIndex + fileString.length).split(":");
			if (parts.length >= 4) {
				let file = parts[0];
				let sourceMapFile = path.join(this.$projectData.projectDir, file + ".map");
				let row = parseInt(parts[1]);
				let column = parseInt(parts[2]);
				if (this.$fs.exists(sourceMapFile).wait()) {
					let sourceMap = this.$fs.readText(sourceMapFile, "utf8").wait();
					let smc = new sourcemap.SourceMapConsumer(sourceMap);
					let originalPosition = smc.originalPositionFor({line:row,column:column});
					data = data.substring(0, fileIndex + fileString.length)
						+ file.replace(".js", ".ts") + ":"
						+ originalPosition.line + ":"
						+ originalPosition.column;
					for (let i = 3; i<parts.length; i++) {
						data += ":" + parts[i];
					}
				}
			}
		}
		return data;
	}
}
$injector.register("iOSLogFilter", IOSLogFilter);
