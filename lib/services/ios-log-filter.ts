let sourcemap = require("source-map");
import * as path from "path";

export class IOSLogFilter implements Mobile.IPlatformLogFilter {

	private $projectData: IProjectData;

	constructor(
		private $fs: IFileSystem,
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
				}
			}
			data = this.getOriginalFileLocation(data);
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
				if (this.ensureProjectData()) {
					let sourceMapFile = path.join(this.$projectData.projectDir, file + ".map");
					let row = parseInt(parts[1]);
					let column = parseInt(parts[2]);
					if (this.$fs.exists(sourceMapFile).wait()) {
						let sourceMap = this.$fs.readText(sourceMapFile, "utf8").wait();
						let smc = new sourcemap.SourceMapConsumer(sourceMap);
						let originalPosition = smc.originalPositionFor({line:row,column:column});
						let sourceFile = smc.sources.length > 0 ? file.replace(smc.file, smc.sources[0]) : file;
						data = data.substring(0, fileIndex + fileString.length)
							+ sourceFile + ":"
							+ originalPosition.line + ":"
							+ originalPosition.column;
						for (let i = 3; i<parts.length; i++) {
							data += ":" + parts[i];
						}
					}
				}
			}
		}
		return data;
	}

	private ensureProjectData(): boolean {
		if (!this.$projectData) {
			this.$projectData = $injector.resolve("projectData");
		}
		return !!this.$projectData;
	}
}
$injector.register("iOSLogFilter", IOSLogFilter);
