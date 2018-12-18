import { TrackActionNames, AnalyticsEventLabelDelimiter } from "../constants";
const EOL = require("os").EOL;
import { getFormattedDate } from "../common/helpers";
const { performance } = require('perf_hooks');

export class PerformanceService implements IPerformanceService {
	public static LOG_MESSAGE_TEMPLATE = `Execution of method "%s" took %s ms.`;
	public static FAIL_LOG_MESSAGE_TEMPLATE = `Failed to log pefromance data for method %s.`;

	constructor(
		private $options: IOptions,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $analyticsService: IAnalyticsService
	) { }

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
		return performance.now();
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
		const getCircularReplacer = () => {
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
		};

		try {
			methodArgs = JSON.stringify(args, getCircularReplacer());
		} catch (e) {
			methodArgs = "cyclic args";
		}

		const info = {
			methodInfo,
			executionTime,
			timestamp: getFormattedDate(),
			methodArgs: JSON.parse(methodArgs)
		}

		try {
			this.$fs.appendFile(filePath, `${JSON.stringify(info)}${EOL}`);
		} catch (e) {
			this.$logger.trace(PerformanceService.FAIL_LOG_MESSAGE_TEMPLATE, methodInfo);
		}
	}
}

$injector.register('performanceService', PerformanceService);
