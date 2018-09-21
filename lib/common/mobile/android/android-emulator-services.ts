import { AndroidVirtualDevice } from "../../constants";
import { getCurrentEpochTime, sleep } from "../../helpers";
import { EOL } from "os";

export class AndroidEmulatorServices implements Mobile.IEmulatorPlatformService {
	constructor(private $androidGenymotionService: Mobile.IAndroidVirtualDeviceService,
		private $androidVirtualDeviceService: Mobile.IAndroidVirtualDeviceService,
		private $adb: Mobile.IAndroidDebugBridge,
		private $childProcess: IChildProcess,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $logger: ILogger,
		private $utils: IUtils) { }

	public async getEmulatorImages(): Promise<Mobile.IEmulatorImagesOutput> {
		const adbDevicesOutput = await this.$adb.getDevicesSafe();
		const avdAvailableEmulatorsOutput = await this.$androidVirtualDeviceService.getEmulatorImages(adbDevicesOutput);
		const genyAvailableDevicesOutput = await this.$androidGenymotionService.getEmulatorImages(adbDevicesOutput);

		return {
			devices: avdAvailableEmulatorsOutput.devices.concat(genyAvailableDevicesOutput.devices),
			errors: avdAvailableEmulatorsOutput.errors.concat(genyAvailableDevicesOutput.errors)
		};
	}

	public async getRunningEmulatorIds(): Promise<string[]> {
		const adbDevicesOutput = await this.$adb.getDevicesSafe();
		const avds = await this.$androidVirtualDeviceService.getRunningEmulatorIds(adbDevicesOutput);
		const genies = await this.$androidGenymotionService.getRunningEmulatorIds(adbDevicesOutput);
		return avds.concat(genies);
	}

	public async getRunningEmulatorName(emulatorId: string): Promise<string> {
		let result = await this.$androidVirtualDeviceService.getRunningEmulatorName(emulatorId);
		if (!result) {
			result = await this.$androidGenymotionService.getRunningEmulatorName(emulatorId);
		}

		return result;
	}

	public async getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string> {
		let result = await this.$androidVirtualDeviceService.getRunningEmulatorImageIdentifier(emulatorId);
		if (!result) {
			result = await this.$androidGenymotionService.getRunningEmulatorImageIdentifier(emulatorId);
		}

		return result;
	}

	public async startEmulator(options: Mobile.IAndroidStartEmulatorOptions): Promise<Mobile.IStartEmulatorOutput> {
		const output = await this.startEmulatorCore(options);
		let bootToCompleteOutput = null;
		if (output && output.runningEmulator) {
			bootToCompleteOutput = await this.waitForEmulatorBootToComplete(output.runningEmulator, output.endTimeEpoch, options.timeout);
		}

		return {
			errors: ((output && output.errors) || []).concat((bootToCompleteOutput && bootToCompleteOutput.errors) || [])
		};
	}

	private async startEmulatorCore(options: Mobile.IAndroidStartEmulatorOptions): Promise<{runningEmulator: Mobile.IDeviceInfo, errors: string[], endTimeEpoch: number}> {
		const timeout = options.timeout || AndroidVirtualDevice.TIMEOUT_SECONDS;
		const endTimeEpoch = getCurrentEpochTime() + this.$utils.getMilliSecondsTimeout(timeout);

		const availableEmulators = (await this.getEmulatorImages()).devices;

		let emulator = this.$emulatorHelper.getEmulatorByStartEmulatorOptions(options, availableEmulators);
		if (!emulator && !options.emulatorIdOrName && !options.imageIdentifier && !options.emulator) {
			emulator = this.getBestFit(availableEmulators);
		}

		if (!emulator) {
			return {
				runningEmulator: null,
				errors: [`No emulator image available for device identifier '${options.emulatorIdOrName || options.imageIdentifier}'.`],
				endTimeEpoch
			};
		}

		if (emulator.errorHelp) {
			return {
				runningEmulator: null,
				errors: [emulator.errorHelp],
				endTimeEpoch
			};
		}

		this.spawnEmulator(emulator);

		const isInfiniteWait = this.$utils.getMilliSecondsTimeout(timeout) === 0;
		let hasTimeLeft = getCurrentEpochTime() < endTimeEpoch;

		while (hasTimeLeft || isInfiniteWait) {
			const emulators = (await this.getEmulatorImages()).devices;
			emulator = _.find(emulators, e => e.imageIdentifier === emulator.imageIdentifier);
			if (emulator && this.$emulatorHelper.isEmulatorRunning(emulator)) {
				return {
					runningEmulator: emulator,
					errors: [],
					endTimeEpoch
				};
			}

			await sleep(10000); // the emulator definitely takes its time to wake up
			hasTimeLeft = getCurrentEpochTime() < endTimeEpoch;
		}

		if (!hasTimeLeft && !isInfiniteWait) {
			return {
				runningEmulator: null,
				errors: [AndroidVirtualDevice.UNABLE_TO_START_EMULATOR_MESSAGE],
				endTimeEpoch
			};
		}
	}

	private spawnEmulator(emulator: Mobile.IDeviceInfo): void {
		let pathToEmulatorExecutable = null;
		let startEmulatorArgs = null;
		if (emulator.vendor === AndroidVirtualDevice.AVD_VENDOR_NAME) {
			pathToEmulatorExecutable = this.$androidVirtualDeviceService.pathToEmulatorExecutable;
			startEmulatorArgs = this.$androidVirtualDeviceService.startEmulatorArgs(emulator.imageIdentifier);
		} else if (emulator.vendor === AndroidVirtualDevice.GENYMOTION_VENDOR_NAME) {
			pathToEmulatorExecutable = this.$androidGenymotionService.pathToEmulatorExecutable;
			startEmulatorArgs = this.$androidGenymotionService.startEmulatorArgs(emulator.imageIdentifier);
		}

		this.$logger.info(`Starting Android emulator with image ${emulator.imageIdentifier}`);

		const childProcess = this.$childProcess.spawn(pathToEmulatorExecutable, startEmulatorArgs, { stdio: "ignore", detached: true });
		childProcess.unref();
		childProcess.on("error", (err: Error) => {
			this.$logger.trace(`Error when starting emulator. More info: ${err}`);
		});
	}

	private getBestFit(emulators: Mobile.IDeviceInfo[]) {
		const best = _(emulators).maxBy(emulator => emulator.version);
		return (best && best.version >= AndroidVirtualDevice.MIN_ANDROID_VERSION) ? best : null;
	}

	private async waitForEmulatorBootToComplete(emulator: Mobile.IDeviceInfo, endTimeEpoch: number, timeout: number): Promise<{runningEmulator: Mobile.IDeviceInfo, errors: string[]}> {
		this.$logger.printInfoMessageOnSameLine("Waiting for emulator device initialization...");

		const isInfiniteWait = this.$utils.getMilliSecondsTimeout(timeout || AndroidVirtualDevice.TIMEOUT_SECONDS) === 0;
		while (getCurrentEpochTime() < endTimeEpoch || isInfiniteWait) {
			const isEmulatorBootCompleted = await this.isEmulatorBootCompleted(emulator.identifier);
			if (isEmulatorBootCompleted) {
				this.$logger.printInfoMessageOnSameLine(EOL);
				return {
					runningEmulator: emulator,
					errors: []
				};
			}

			this.$logger.printInfoMessageOnSameLine(".");
			await sleep(10000);
		}

		return {
			runningEmulator: null,
			errors: [AndroidVirtualDevice.UNABLE_TO_START_EMULATOR_MESSAGE]
		};
	}

	private async isEmulatorBootCompleted(emulatorId: string): Promise<boolean> {
		const output = await this.$adb.getPropertyValue(emulatorId, "dev.bootcomplete");
		const matches = output.match("1");
		return matches && matches.length > 0;
	}
}
$injector.register("androidEmulatorServices", AndroidEmulatorServices);
