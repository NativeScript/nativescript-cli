let sourcemap = require("source-map");
import * as path from "path";
import { cache } from "../common/decorators";
import * as iOSLogFilterBase from "../common/mobile/ios/ios-log-filter";

export class IOSLogFilter extends iOSLogFilterBase.IOSLogFilter implements Mobile.IPlatformLogFilter {
	protected infoFilterRegex = /^.*?(<Notice>:.*?((CONSOLE LOG|JS ERROR).*?)|(<Warning>:.*?)|(<Error>:.*?))$/im;

	private partialLine: string = null;

	constructor($loggingLevels: Mobile.ILoggingLevels,
		private $fs: IFileSystem,
		private $projectData: IProjectData) {
			super($loggingLevels);
		}

	public filterData(data: string, logLevel: string, pid?: string): string {
		data  = super.filterData(data, logLevel, pid);
		if (pid && data && data.indexOf(`[${pid}]`) === -1) {
			return null;
		}

		if (data) {
			let skipLastLine = data[data.length - 1] !== "\n";
			let lines = data.split("\n");
			let result = "";
			for (let i = 0; i < lines.length; i++) {
				let line = lines[i];
				if (i === 0 && this.partialLine) {
					line = this.partialLine + line;
					this.partialLine = null;
				}
				if (line.length < 1 ||
					line.indexOf("SecTaskCopyDebugDescription") !== -1 ||
					line.indexOf("NativeScript loaded bundle") !== -1 ||
					(line.indexOf("assertion failed:") !== -1 && data.indexOf("libxpc.dylib") !== -1)) {
					continue;
				}
				// CONSOLE LOG messages comme in the following form:
				// <date> <domain> <app>[pid] CONSOLE LOG file:///location:row:column: <actual message goes here>
				// This code removes unnecessary information from log messages. The output looks like:
				// CONSOLE LOG file:///location:row:column: <actual message goes here>
				if (pid) {
					let searchString = "[" + pid + "]: ";
					let pidIndex = line.indexOf(searchString);
					if (pidIndex > 0) {
						line = line.substring(pidIndex + searchString.length, line.length);
						this.getOriginalFileLocation(line);
						result += this.getOriginalFileLocation(line) + "\n";
						continue;
					}
				}
				if (skipLastLine && i === lines.length - 1 && lines.length > 1) {
					this.partialLine = line;
				} else {
					result += this.getOriginalFileLocation(line) + "\n";
				}
			}
			return result;
		}

		return data;
	}

	private getOriginalFileLocation(data: string): string {
		const fileString = "file:///";
		const fileIndex = data.indexOf(fileString);
		const projectDir = this.getProjectDir();

		if (fileIndex >= 0 && projectDir) {
			let parts = data.substring(fileIndex + fileString.length).split(":");
			if (parts.length >= 4) {
				let file = parts[0];
				let sourceMapFile = path.join(projectDir, file + ".map");
				let row = parseInt(parts[1]);
				let column = parseInt(parts[2]);
				if (this.$fs.exists(sourceMapFile)) {
					let sourceMap = this.$fs.readText(sourceMapFile);
					let smc = new sourcemap.SourceMapConsumer(sourceMap);
					let originalPosition = smc.originalPositionFor({ line: row, column: column });
					let sourceFile = smc.sources.length > 0 ? file.replace(smc.file, smc.sources[0]) : file;
					data = data.substring(0, fileIndex + fileString.length)
						+ sourceFile + ":"
						+ originalPosition.line + ":"
						+ originalPosition.column;

					for (let i = 3; i < parts.length; i++) {
						data += ":" + parts[i];
					}
				}
			}
		}

		return data;
	}

	@cache()
	private getProjectDir(): string {
		try {
			this.$projectData.initializeProjectData();
			return this.$projectData.projectDir;
		} catch (err) {
			return null;
		}
	}
}

$injector.register("iOSLogFilter", IOSLogFilter);
