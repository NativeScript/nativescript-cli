import { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import * as _ from 'lodash';
import { IDictionary, IShouldDispose, IDisposable } from "../../../declarations";
import { injector } from "../../../yok";

export class IOSSimulatorLogProvider extends EventEmitter implements Mobile.IiOSSimulatorLogProvider, IDisposable, IShouldDispose {
	public shouldDispose: boolean;
	private simulatorsLoggingEnabled: IDictionary<boolean> = {};
	private simulatorsLogProcess: IDictionary<ChildProcess> = {};

	constructor(private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $deviceLogProvider: Mobile.IDeviceLogProvider) {
		super();
		this.shouldDispose = true;
	}

	public setShouldDispose(shouldDispose: boolean) {
		this.shouldDispose = shouldDispose;
	}

	public async startLogProcess(deviceId: string, options?: Mobile.IiOSLogStreamOptions): Promise<void> {
		if (!this.simulatorsLoggingEnabled[deviceId]) {
			const deviceLogChildProcess: ChildProcess = await this.$iOSSimResolver.iOSSim.getDeviceLogProcess(deviceId, options ? options.predicate : null);

			const action = (data: Buffer | string) => {
				const message = data.toString();
				this.$deviceLogProvider.logData(message, this.$devicePlatformsConstants.iOS, deviceId);
			};

			if (deviceLogChildProcess) {
				deviceLogChildProcess.once("close", () => {
					this.simulatorsLoggingEnabled[deviceId] = false;
				});

				deviceLogChildProcess.once("error", (err) => {
					this.$logger.trace(`Error is thrown for device with identifier ${deviceId}. More info: ${err.message}.`);
					this.simulatorsLoggingEnabled[deviceId] = false;
				});
			}

			if (deviceLogChildProcess.stdout) {
				deviceLogChildProcess.stdout.on("data", action.bind(this));
			}

			if (deviceLogChildProcess.stderr) {
				deviceLogChildProcess.stderr.on("data", action.bind(this));
			}

			this.simulatorsLoggingEnabled[deviceId] = true;
			this.simulatorsLogProcess[deviceId] = deviceLogChildProcess;
		}
	}

	public dispose(signal?: any) {
		if (this.shouldDispose) {
			_.each(this.simulatorsLogProcess, (logProcess: ChildProcess, deviceId: string) => {
				if (logProcess) {
					logProcess.kill(signal);
				}
			});
		}
	}
}
injector.register("iOSSimulatorLogProvider", IOSSimulatorLogProvider);
