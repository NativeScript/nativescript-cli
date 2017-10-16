const sourcemap = require("source-map");
import * as path from "path";
import { cache } from "../common/decorators";
import * as iOSLogFilterBase from "../common/mobile/ios/ios-log-filter";

export class IOSLogFilter extends iOSLogFilterBase.IOSLogFilter implements Mobile.IPlatformLogFilter {
	protected infoFilterRegex = /^.*?((?:<Notice>:)?.*?(((?:CONSOLE|JS) (?:LOG|ERROR)).*?))$/im;

	private partialLine: string = null;

	constructor($loggingLevels: Mobile.ILoggingLevels,
		private $fs: IFileSystem,
		private $projectData: IProjectData) {
		super($loggingLevels);
	}

	public filterData(data: string, logLevel: string, pid?: string): string {
		data = super.filterData(data, logLevel, pid);
		if (pid && data && data.indexOf(`[${pid}]`) === -1) {
			return null;
		}

		if (data) {
			const skipLastLine = data[data.length - 1] !== "\n";
			const lines = data.split("\n");
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
					if (line.indexOf(`[${pid}]: `) !== -1) {
						const pidRegex = new RegExp(`^.*\\[${pid}\\]:\\s(?:\\(NativeScript\\)\\s)?`);
						line = line.replace(pidRegex, "").trim();
						this.getOriginalFileLocation(line);
						result += this.getOriginalFileLocation(line) + "\n";
					}

					continue;
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
			const parts = data.substring(fileIndex + fileString.length).split(":");
			if (parts.length >= 4) {
				const file = parts[0];
				const sourceMapFile = path.join(projectDir, file + ".map");
				const row = parseInt(parts[1]);
				const column = parseInt(parts[2]);
				if (this.$fs.exists(sourceMapFile)) {
					const sourceMap = this.$fs.readText(sourceMapFile);
					const smc = new sourcemap.SourceMapConsumer(sourceMap);
					const originalPosition = smc.originalPositionFor({ line: row, column: column });
					const sourceFile = smc.sources.length > 0 ? file.replace(smc.file, smc.sources[0]) : file;
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
