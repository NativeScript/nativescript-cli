import byline = require("byline");
import { DeviceAndroidDebugBridge } from "./device-android-debug-bridge";
import { ChildProcess } from "child_process";
import * as semver from "semver";

interface IDeviceLoggingData {
	loggingProcess: ChildProcess;
	lineStream: any;
	keepSingleProcess: boolean;
}

export class LogcatHelper implements Mobile.ILogcatHelper {
	private mapDevicesLoggingData: IDictionary<IDeviceLoggingData>;

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $injector: IInjector,
		private $processService: IProcessService,
		private $devicesService: Mobile.IDevicesService) {
		this.mapDevicesLoggingData = Object.create(null);
	}

	public async start(options: Mobile.ILogcatStartOptions): Promise<void> {
		const deviceIdentifier = options.deviceIdentifier;
		if (deviceIdentifier && !this.mapDevicesLoggingData[deviceIdentifier]) {
			this.mapDevicesLoggingData[deviceIdentifier] = {
				loggingProcess: null,
				lineStream: null,
				keepSingleProcess: options.keepSingleProcess
			};

			const logcatStream = await this.getLogcatStream(deviceIdentifier, options.pid);
			const lineStream = byline(logcatStream.stdout);
			this.mapDevicesLoggingData[deviceIdentifier].loggingProcess = logcatStream;
			this.mapDevicesLoggingData[deviceIdentifier].lineStream = lineStream;
			logcatStream.stderr.on("data", (data: NodeBuffer) => {
				this.$logger.trace("ADB logcat stderr: " + data.toString());
			});

			logcatStream.on("close", (code: number) => {
				try {
					this.stop(deviceIdentifier);
					if (code !== 0) {
						this.$logger.trace("ADB process exited with code " + code.toString());
					}
				} catch (err) {
					// Ignore the error, the process is dead.
				}
			});

			lineStream.on('data', (line: NodeBuffer) => {
				const lineText = line.toString();
				this.$deviceLogProvider.logData(lineText, this.$devicePlatformsConstants.Android, deviceIdentifier);
			});

			this.$processService.attachToProcessExitSignals(this, logcatStream.kill);
		}
	}

	private async getLogcatStream(deviceIdentifier: string, pid?: string) {
		const device = await this.$devicesService.getDevice(deviceIdentifier);
		const minAndroidWithLogcatPidSupport = "7.0.0";
		const isLogcatPidSupported =  semver.gte(semver.coerce(device.deviceInfo.version), minAndroidWithLogcatPidSupport);
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
		const logcatCommand = ["logcat"];

		if (pid && isLogcatPidSupported) {
			logcatCommand.push(`--pid=${pid}`);
		}
		const logcatStream = await adb.executeCommand(logcatCommand, { returnChildProcess: true });
		return logcatStream;
	}

	public async dump(deviceIdentifier: string): Promise<void> {
		const adb: Mobile.IDeviceAndroidDebugBridge = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
		const logcatDumpStream = await adb.executeCommand(["logcat", "-d"], { returnChildProcess: true });

		const lineStream = byline(logcatDumpStream.stdout);
		lineStream.on('data', (line: NodeBuffer) => {
			const lineText = line.toString();
			this.$logger.trace(lineText);
		});

		logcatDumpStream.on("close", (code: number) => {
			logcatDumpStream.removeAllListeners();
			lineStream.removeAllListeners();
		});

		this.$processService.attachToProcessExitSignals(this, logcatDumpStream.kill);
	}

	/**
	 * Stops the logcat process for the specified device if keepSingleProcess is not passed on start
	 */
	public stop(deviceIdentifier: string): void {
		if (this.mapDevicesLoggingData[deviceIdentifier] && !this.mapDevicesLoggingData[deviceIdentifier].keepSingleProcess) {
			this.mapDevicesLoggingData[deviceIdentifier].loggingProcess.removeAllListeners();
			this.mapDevicesLoggingData[deviceIdentifier].loggingProcess.kill("SIGINT");
			this.mapDevicesLoggingData[deviceIdentifier].lineStream.removeAllListeners();
			delete this.mapDevicesLoggingData[deviceIdentifier];
		}
	}
}

$injector.register("logcatHelper", LogcatHelper);
