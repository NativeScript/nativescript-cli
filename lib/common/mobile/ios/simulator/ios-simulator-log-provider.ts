import { ChildProcess } from "child_process";
import { DEVICE_LOG_EVENT_NAME } from "../../../constants";
import { EventEmitter } from "events";

export class IOSSimulatorLogProvider extends EventEmitter implements Mobile.IiOSSimulatorLogProvider, IDisposable, IShouldDispose {
	public shouldDispose: boolean;
	private simulatorsLoggingEnabled: IDictionary<boolean> = {};
	private simulatorsLogProcess: IDictionary<ChildProcess> = {};

	constructor(private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $logger: ILogger,
		private $processService: IProcessService) {
			super();
			this.shouldDispose = true;
		}

	public setShouldDispose(shouldDispose: boolean) {
		this.shouldDispose = shouldDispose;
	}

	public async startLogProcess(deviceId: string, options?: Mobile.IiOSLogStreamOptions): Promise<void> {
		if (!this.simulatorsLoggingEnabled[deviceId]) {
			const deviceLogChildProcess: ChildProcess = await this.$iOSSimResolver.iOSSim.getDeviceLogProcess(deviceId, options ? options.predicate : null);

			const action = (data: NodeBuffer | string) => {
				const message = data.toString();
				this.emit(DEVICE_LOG_EVENT_NAME, { deviceId, message, muted: (options || {}).muted });
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

			this.$processService.attachToProcessExitSignals(this, deviceLogChildProcess.kill);

			this.simulatorsLoggingEnabled[deviceId] = true;
			this.simulatorsLogProcess[deviceId] = deviceLogChildProcess;
		}
	}

	public async startNewMutedLogProcess(deviceId: string, options?: Mobile.IiOSLogStreamOptions): Promise<void> {
		options = options || {};
		options.muted = true;
		this.simulatorsLoggingEnabled[deviceId] = false;
		await this.startLogProcess(deviceId, options);
		this.simulatorsLoggingEnabled[deviceId] = false;
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
$injector.register("iOSSimulatorLogProvider", IOSSimulatorLogProvider);
