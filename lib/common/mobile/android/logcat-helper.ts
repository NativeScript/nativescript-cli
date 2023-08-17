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

	public async start(
		options: Mobile.ILogcatStartOptions,
		onAppRestarted?: () => void
	): Promise<void> {
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
					if (
						!line.includes(options.appId) ||
						!line.includes("START") ||
						line.indexOf(options.pid) > -1
					)
						continue;
					this.forceStop(deviceIdentifier);
					if (onAppRestarted) {
						onAppRestarted();
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

	private async getLogcatStream(deviceIdentifier: string, pid?: string) {
		const device = await this.$devicesService.getDevice(deviceIdentifier);
		const minAndroidWithLogcatPidSupport = "7.0.0";
		const isLogcatPidSupported =
			!!device.deviceInfo.version &&
			semver.gte(
				semver.coerce(device.deviceInfo.version),
				minAndroidWithLogcatPidSupport
			);
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(
			DeviceAndroidDebugBridge,
			{ identifier: deviceIdentifier }
		);
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
		const device = await this.$devicesService.getDevice(deviceIdentifier);
		const minAndroidWithLogcatPidSupport = "7.0.0";
		const isLogcatPidSupported =
			!!device.deviceInfo.version &&
			semver.gte(
				semver.coerce(device.deviceInfo.version),
				minAndroidWithLogcatPidSupport
			);
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(
			DeviceAndroidDebugBridge,
			{ identifier: deviceIdentifier }
		);
		const logcatCommand = [`logcat`, `-T`, `1`];

		if (appId && isLogcatPidSupported) {
			logcatCommand.push(`--regex=START.*${appId}`);
		}

		const appStartTrackingStream = await adb.executeCommand(logcatCommand, {
			returnChildProcess: true,
		});

		return appStartTrackingStream;
	}
}

injector.register("logcatHelper", LogcatHelper);
