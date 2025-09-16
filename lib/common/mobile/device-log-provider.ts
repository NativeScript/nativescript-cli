import { DeviceLogProviderBase } from "./device-log-provider-base";
import { DEVICE_LOG_EVENT_NAME } from "../constants";
import { injector } from "../yok";

import { LoggerConfigData } from "../../constants";
import { IOptions } from "../../declarations";
import { color, StyleFormat } from "../../color";

import { ITimelineProfilerService } from "../../services/timeline-profiler-service";

export class DeviceLogProvider extends DeviceLogProviderBase {
	constructor(
		protected $logFilter: Mobile.ILogFilter,
		protected $logger: ILogger,
		protected $logSourceMapService: Mobile.ILogSourceMapService,
		protected $timelineProfilerService: ITimelineProfilerService,
		protected $options: IOptions,
	) {
		super($logFilter, $logger, $logSourceMapService);
	}

	public logData(
		lineText: string,
		platform: string,
		deviceIdentifier: string,
	): void {
		// console.log(lineText)
		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier);
		let data = this.$logFilter.filterData(platform, lineText, loggingOptions);
		data = this.$logSourceMapService.replaceWithOriginalFileLocations(
			platform,
			data,
			loggingOptions,
		);

		if (data) {
			this.$timelineProfilerService.processLogData(data, deviceIdentifier);
			this.logDataCore(data, deviceIdentifier);
			this.emit(DEVICE_LOG_EVENT_NAME, lineText, deviceIdentifier, platform);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		this.$logFilter.loggingLevel = logLevel.toUpperCase();
	}

	private consoleLogLevelRegex: RegExp =
		/^CONSOLE (LOG|INFO|WARN|ERROR|TRACE|INFO( .+)|TIME):\s/;
	private consoleLevelColor: Record<string, (line: string) => string> = {
		log: (line) => line,
		info: color.cyanBright,
		warn: color.yellowBright,
		error: color.redBright,
		trace: color.grey,
		time: color.greenBright,
	};

	private deviceColorMap = new Map<string, StyleFormat>();

	private colorPool: StyleFormat[] = [
		"bgGray",
		"bgBlueBright",
		"bgWhiteBright",
		"bgCyanBright",
		"bgYellowBright",
		"bgMagentaBright",
	];
	private colorPoolIndex = 0;

	private getDeviceColor(deviceIdentifier: string) {
		if (this.deviceColorMap.has(deviceIdentifier)) {
			return this.deviceColorMap.get(deviceIdentifier);
		}

		const color = this.colorPool[this.colorPoolIndex] as StyleFormat;
		// wrap around if we have no more colors in the pool
		this.colorPoolIndex =
			this.colorPoolIndex === this.colorPool.length - 1
				? 0
				: this.colorPoolIndex + 1;

		this.deviceColorMap.set(deviceIdentifier, color);

		return color;
	}

	private logDataCore(data: string, deviceIdentifier: string): void {
		// todo: use config to set logger - --env.classicLogs is temporary!
		if ("classicLogs" in (this.$options.env ?? {})) {
			// legacy logging
			this.$logger.info(data, { [LoggerConfigData.skipNewLine]: true });
			return;
		}

		// todo: extract into an injectable printer/logger service
		let shouldPrepend = false;
		let splitIndexes: number[] = [];
		const lines = data
			.split(/\n(CONSOLE)/)
			.map((line, index, lines) => {
				if (line === "CONSOLE") {
					shouldPrepend = true;

					if (lines[index - 1]) {
						splitIndexes.push(index - 1);
					}

					return null;
				}

				if (shouldPrepend) {
					shouldPrepend = false;
					return `CONSOLE${line}`;
				}

				const suffix = line.endsWith("\n") ? "" : "\n";
				return line + suffix;
			})
			.map((line, index) => {
				if (splitIndexes.includes(index)) {
					return line + "\n";
				}
				return line;
			})
			.filter((line) => {
				return line !== null;
			});

		if (!lines.length && data.length) {
			lines.push(data);
		}

		for (const line of lines) {
			let [match, level, timeLabel] =
				this.consoleLogLevelRegex.exec(line) ?? [];

			if (timeLabel) {
				level = "time";
				timeLabel = timeLabel.replace("INFO ", "").trim() + ": ";
			} else if (!level && line.startsWith("Trace:")) {
				level = "trace";
			} else {
				level = level?.toLowerCase() ?? "log";
			}

			const toLog = [timeLabel ?? "", match ? line.replace(match, "") : line]
				.join("")
				.trimEnd();

			toLog.split("\n").forEach((actualLine) => {
				this.printLine(
					color.styleText(this.getDeviceColor(deviceIdentifier), " "),
					this.consoleLevelColor[level](actualLine),
				);
			});
		}
	}

	private printLine(prefix: string, ...parts: string[]) {
		const fullLine = parts.join(" ");
		console.log(prefix, fullLine);

		/**
		 * Note: Disabled
		 *
		 * This splits the output into lines that fit within the current
		 * terminal width, however this makes copying json objects that
		 * span across multiple lines difficult, as it introduces
		 * whitespace & line breaks
		 */
		// const maxWidth = process.stdout.columns - 2;
		// if (!maxWidth || maxWidth < 10 || fullLine.length < maxWidth) {
		// 	console.log(prefix, fullLine);
		// } else {
		// 	for (let i = 0; i < fullLine.length; i += maxWidth) {
		// 		const part = fullLine.substring(i, i + maxWidth);
		// 		console.log(prefix, part);
		// 	}
		// }
	}
}
injector.register("deviceLogProvider", DeviceLogProvider);
