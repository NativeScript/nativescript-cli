import { ChildProcess } from "child_process";
import * as readline from "readline";
import { EventEmitter } from "events";
import * as _ from "lodash";
import {
	IDictionary,
	IShouldDispose,
	IDisposable,
} from "../../../declarations";
import { injector } from "../../../yok";
import { IChildProcess } from "../../../declarations";
import { getIOSLogScope } from "../ios-log-entry";

export class IOSSimulatorLogProvider
	extends EventEmitter
	implements Mobile.IiOSSimulatorLogProvider, IDisposable, IShouldDispose
{
	public shouldDispose: boolean;
	private simulatorsLoggingEnabled: IDictionary<boolean> = {};
	private simulatorsLogProcess: IDictionary<ChildProcess> = {};

	constructor(
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $childProcess: IChildProcess,
	) {
		super();
		this.shouldDispose = true;
	}

	public setShouldDispose(shouldDispose: boolean) {
		this.shouldDispose = shouldDispose;
	}

	public async startLogProcess(
		deviceId: string,
		options?: Mobile.IiOSLogStreamOptions,
	): Promise<void> {
		if (!this.simulatorsLoggingEnabled[deviceId]) {
			// Structured logs need the app's executable name to select its
			// entries; without one the predicate decides what is shown.
			const processName =
				this.$deviceLogProvider.getProjectNameForDevice(deviceId);
			const deviceLogChildProcess: ChildProcess = processName
				? this.startStructuredLogProcess(deviceId, processName)
				: await this.$iOSSimResolver.iOSSim.getDeviceLogProcess(
						deviceId,
						options ? options.predicate : null,
					);

			const action = (data: Buffer | string) => {
				const message = data.toString();
				this.$deviceLogProvider.logData(
					message,
					this.$devicePlatformsConstants.iOS,
					deviceId,
				);
			};

			if (deviceLogChildProcess) {
				deviceLogChildProcess.once("close", () => {
					this.simulatorsLoggingEnabled[deviceId] = false;
				});

				deviceLogChildProcess.once("error", (err) => {
					this.$logger.trace(
						`Error is thrown for device with identifier ${deviceId}. More info: ${err.message}.`,
					);
					this.simulatorsLoggingEnabled[deviceId] = false;
				});
			}

			if (processName) {
				readline
					.createInterface({ input: deviceLogChildProcess.stdout })
					.on("line", (line) => this.logStructuredLine(deviceId, line));
			} else {
				if (deviceLogChildProcess.stdout) {
					deviceLogChildProcess.stdout.on("data", action.bind(this));
				}

				if (deviceLogChildProcess.stderr) {
					deviceLogChildProcess.stderr.on("data", action.bind(this));
				}
			}

			this.simulatorsLoggingEnabled[deviceId] = true;
			this.simulatorsLogProcess[deviceId] = deviceLogChildProcess;
		}
	}

	private startStructuredLogProcess(
		deviceId: string,
		processName: string,
	): ChildProcess {
		// Matched by name rather than pid, so the logs follow the app when it is
		// relaunched. log stream leaves out info and debug entries by default.
		const scope = getIOSLogScope(this.$logger.getLevel(), false);
		const args = [
			"simctl",
			"spawn",
			deviceId,
			"log",
			"stream",
			"--style",
			"ndjson",
			"--predicate",
			`process == ${JSON.stringify(processName)}`,
		];
		if (scope.includeNative) {
			args.push("--level", scope.includeDebug ? "debug" : "info");
		}

		return this.$childProcess.spawn("xcrun", args);
	}

	private logStructuredLine(deviceId: string, line: string): void {
		// log stream prints a non-JSON "Filtering the log data..." header first.
		if (!line.startsWith("{")) {
			return;
		}

		let event: any;
		try {
			event = JSON.parse(line);
		} catch (err) {
			this.$logger.trace(`Unable to parse simulator log entry: ${line}`);
			return;
		}

		// Activities and signposts are streamed too, but are not log messages.
		if (event.eventType && event.eventType !== "logEvent") {
			return;
		}

		this.$deviceLogProvider.logEntry(
			{
				pid: event.processID,
				thread: event.threadID,
				process: event.processImagePath,
				image: event.senderImagePath,
				level: (event.messageType || "").toLowerCase(),
				message: event.eventMessage,
				subsystem: event.subsystem,
				category: event.category,
			},
			this.$devicePlatformsConstants.iOS,
			deviceId,
		);
	}

	public dispose(signal?: any) {
		if (this.shouldDispose) {
			_.each(
				this.simulatorsLogProcess,
				(logProcess: ChildProcess, deviceId: string) => {
					if (logProcess) {
						logProcess.kill(signal);
					}
				},
			);
		}
	}
}
injector.register("iOSSimulatorLogProvider", IOSSimulatorLogProvider);
