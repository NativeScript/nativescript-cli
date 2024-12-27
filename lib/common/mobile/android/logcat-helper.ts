import * as byline from "byline";
import { ChildProcess } from "child_process";
import * as semver from "semver";
import { IDictionary } from "../../declarations";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";
import { DeviceAndroidDebugBridge } from "./device-android-debug-bridge";

interface IDeviceLoggingData {
	loggingProcess: ChildProcess;
	appStartTrackingProcess: ChildProcess;
	lineStream: any;
	rawLineStream: any;
	keepSingleProcess: boolean;
}

export class LogcatHelper implements Mobile.ILogcatHelper {
	private mapDevicesLoggingData: IDictionary<IDeviceLoggingData>;

	constructor(
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $injector: IInjector,
		private $devicesService: Mobile.IDevicesService
	) {
		this.mapDevicesLoggingData = Object.create(null);
	}

	public async start(options: Mobile.ILogcatStartOptions): Promise<void> {
		const deviceIdentifier = options.deviceIdentifier;
		if (deviceIdentifier && !this.mapDevicesLoggingData[deviceIdentifier]) {
			this.mapDevicesLoggingData[deviceIdentifier] = {
				loggingProcess: null,
				lineStream: null,
				keepSingleProcess: options.keepSingleProcess,
				appStartTrackingProcess: null,
				rawLineStream: null,
			};

			const logcatStream = await this.getLogcatStream(
				deviceIdentifier,
				options.pid
			);

			const lineStream = byline(logcatStream.stdout);
			this.mapDevicesLoggingData[deviceIdentifier].loggingProcess =
				logcatStream;
			this.mapDevicesLoggingData[deviceIdentifier].lineStream = lineStream;
			logcatStream.stderr.on("data", (data: Buffer) => {
				this.$logger.trace("ADB logcat stderr: " + data.toString());
			});

			logcatStream.on("close", (code: number) => {
				try {
					this.forceStop(deviceIdentifier);

					if (code !== 0) {
						this.$logger.trace(
							"ADB process exited with code " + code.toString()
						);
					}
				} catch (err) {
					// Ignore the error, the process is dead.
				}
			});

			lineStream.on("data", (lineBuffer: Buffer) => {
				const lines = (lineBuffer.toString() || "").split("\n");
				for (const line of lines) {
					this.$deviceLogProvider.logData(
						line,
						this.$devicePlatformsConstants.Android,
						deviceIdentifier
					);
				}
			});

			const appStartTrackingStream = await this.getAppStartTrackingLogcatStream(
				deviceIdentifier,
				options.appId
			);

			this.mapDevicesLoggingData[deviceIdentifier].appStartTrackingProcess =
				appStartTrackingStream;

			const rawLineStream = byline(appStartTrackingStream.stdout);
			this.mapDevicesLoggingData[deviceIdentifier].rawLineStream =
				rawLineStream;

			rawLineStream.on("data", (lineBuffer: Buffer) => {
				if (!this.mapDevicesLoggingData[deviceIdentifier]?.loggingProcess)
					return;
				const lines = (lineBuffer.toString() || "").split("\n");
				for (let line of lines) {
					// 2024-06-26 16:43:22.286   630-659   ActivityManager system_server I  Start proc 8854:org.nativescript.uitestsapp/u0a190 for next-top-activity {org.nativescript.uitestsapp/com.tns.NativeScriptActivity}

					const startProc = /Start proc (?<pid>[0-9]+):(?<appId>.+?)\//.exec(
						line
					);

					if (
						startProc &&
						startProc.groups?.appId === options.appId &&
						startProc.groups?.pid !== options.pid
					) {
						this.forceStop(deviceIdentifier);
						options.onAppRestarted?.();
					}
				}
			});
		}
	}

	public async dump(deviceIdentifier: string): Promise<void> {
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(
			DeviceAndroidDebugBridge,
			{ identifier: deviceIdentifier }
		);
		const logcatDumpStream = await adb.executeCommand(["logcat", "-d"], {
			returnChildProcess: true,
		});

		const lineStream = byline(logcatDumpStream.stdout);
		lineStream.on("data", (line: Buffer) => {
			const lineText = line.toString();
			this.$logger.trace(lineText);
		});

		logcatDumpStream.on("close", (code: number) => {
			logcatDumpStream.removeAllListeners();
			lineStream.removeAllListeners();
		});
	}

	/**
	 * Stops the logcat process for the specified device if keepSingleProcess is not passed on start
	 */
	public stop(deviceIdentifier: string): void {
		if (
			this.mapDevicesLoggingData[deviceIdentifier] &&
			!this.mapDevicesLoggingData[deviceIdentifier].keepSingleProcess
		) {
			this.forceStop(deviceIdentifier);
		}
	}

	private forceStop(deviceIdentifier: string): void {
		const loggingData = this.mapDevicesLoggingData[deviceIdentifier];
		loggingData.loggingProcess?.removeAllListeners();
		loggingData.loggingProcess?.kill("SIGINT");
		loggingData.lineStream?.removeAllListeners();

		loggingData.appStartTrackingProcess?.kill("SIGINT");
		loggingData.lineStream?.removeAllListeners();

		delete this.mapDevicesLoggingData[deviceIdentifier];
	}

	/**
	 * @deprecated - we likely don't need this anymore, and can simplify the code...
	 */
	private async isLogcatPidSupported(deviceIdentifier: string) {
		const device = await this.$devicesService.getDevice(deviceIdentifier);
		const minAndroidWithLogcatPidSupport = "7.0.0";
		return (
			!!device.deviceInfo.version &&
			semver.gte(
				semver.coerce(device.deviceInfo.version),
				minAndroidWithLogcatPidSupport
			)
		);
	}

	private async getLogcatStream(deviceIdentifier: string, pid?: string) {
		const isLogcatPidSupported = await this.isLogcatPidSupported(
			deviceIdentifier
		);
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(
			DeviceAndroidDebugBridge,
			{ identifier: deviceIdentifier }
		);

		// -T 1 - shows only new logs after starting adb logcat
		const logcatCommand = ["logcat", "-T", "1"];

		const acceptedTags = [
			"chromium",
			'"Web Console"',
			"JS",
			"System.err",
			"TNS.Native",
			"TNS.Java",
		];

		if (pid && isLogcatPidSupported) {
			logcatCommand.push(`--pid=${pid}`);

			acceptedTags.forEach((tag) => {
				// -s <tag> - shows only logs with the specified tag
				logcatCommand.push("-s", tag);
			});
		}

		const logcatStream = await adb.executeCommand(logcatCommand, {
			returnChildProcess: true,
		});

		return logcatStream;
	}

	private async getAppStartTrackingLogcatStream(
		deviceIdentifier: string,
		appId?: string
	) {
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(
			DeviceAndroidDebugBridge,
			{ identifier: deviceIdentifier }
		);

		// -b system  - shows the system buffer/logs only
		// -T 1 			- shows only new logs after starting adb logcat
		const logcatCommand = [
			`logcat`,
			`-b`,
			`system`,
			`-T`,
			`1`,
			"-s",
			"ActivityManager",
		];

		if (appId) {
			logcatCommand.push(`--regex=Start.*${appId}`);
		}

		const appStartTrackingStream = await adb.executeCommand(logcatCommand, {
			returnChildProcess: true,
		});

		return appStartTrackingStream;
	}
}

injector.register("logcatHelper", LogcatHelper);
