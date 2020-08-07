import { TrackActionNames } from "../constants";
const EOL = require("os").EOL;
import { getFixedLengthDateString } from "../common/helpers";
import * as semver from "semver";
import { IOptions, IPerformanceService } from "../declarations";
import { IAnalyticsService, IFileSystem } from "../common/declarations";
import * as _ from "lodash";

export class PerformanceService implements IPerformanceService {
	public static LOG_MESSAGE_TEMPLATE = `Execution of method "%s" took %s ms.`;
	public static FAIL_LOG_MESSAGE_TEMPLATE = `Failed to log pefromance data in file for method %s.`;
	private static MIN_NODE_PERFORMANCE_MODULE_VERSION = "8.5.0";
	private performance: {now(): number}  = null;

	constructor(
		private $options: IOptions,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $analyticsService: IAnalyticsService
	) {
		if (this.isPerformanceModuleSupported()) {
			this.performance = require("perf_hooks").performance;
		}
	}

	public processExecutionData(methodInfo: string, startTime: number, endTime: number, args: any[]): void {
		const executionTime = Math.floor(endTime - startTime);

		this.trackAnalyticsData(methodInfo, executionTime);

		if (typeof this.$options.performance === "string") {
			this.logDataToFile(this.$options.performance, methodInfo, executionTime, args);
		} else if (this.$options.performance) {
			this.$logger.info(PerformanceService.LOG_MESSAGE_TEMPLATE, methodInfo, executionTime);
		}
	}

	public now(): number {
		if (this.isPerformanceModuleSupported()) {
			return this.performance.now();
		} else {
			return new Date().getTime();
		}
	}

	private isPerformanceModuleSupported(): boolean {
		return semver.gte(process.version, PerformanceService.MIN_NODE_PERFORMANCE_MODULE_VERSION);
	}

	private trackAnalyticsData(methodInfo: string, executionTime: number): void {
		this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.Performance,
			additionalData: methodInfo,
			value: executionTime
		})
		.catch((err) => {
			throw err;
		});
	}

	private logDataToFile(filePath: string, methodInfo: string, executionTime: number, args: any[]) {
		let methodArgs;

		try {
			methodArgs = JSON.stringify(args, this.getJsonSanitizer());
		} catch (e) {
			methodArgs = "cyclic args";
		}

		const info = {
			methodInfo,
			executionTime,
			timestamp: getFixedLengthDateString(),
			methodArgs: JSON.parse(methodArgs)
		};

		try {
			this.$fs.appendFile(filePath, `${JSON.stringify(info)}${EOL}`);
		} catch (e) {
			this.$logger.trace(PerformanceService.FAIL_LOG_MESSAGE_TEMPLATE, methodInfo);
			this.$logger.info(PerformanceService.LOG_MESSAGE_TEMPLATE, methodInfo, executionTime);
		}
	}

	//removes any injected members of the arguments and excludes the options object even if it was renamed
	private getJsonSanitizer() {
		const seen = new WeakSet();
		seen.add(this.$options);
		return (key: any, value: any) => {
			if (typeof value === "object" && value !== null) {
				if (seen.has(value) || _.startsWith(key, "$")) {
					return;
				}
				seen.add(value);
			}
			return value;
		};
	}
}

$injector.register('performanceService', PerformanceService);
