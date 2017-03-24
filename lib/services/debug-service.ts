import { platform } from "os";
import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../constants";

class DebugService extends EventEmitter {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $androidDebugService: IPlatformDebugService,
		private $iOSDebugService: IPlatformDebugService,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super();
	}

	public async debug(debugData: IDebugData, options: IDebugOptions): Promise<string> {
		const device = this.$devicesService.getDeviceByIdentifier(debugData.deviceIdentifier);
		const debugService = this.getDebugService(device);

		debugService.on(CONNECTION_ERROR_EVENT_NAME, (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e));

		if (!device) {
			this.$errors.failWithoutHelp(`Can't find device with identifier ${debugData.deviceIdentifier}`);
		}

		const debugOptions: IDebugOptions = _.merge({}, options || {});
		debugOptions.start = true;

		// TODO: Check if app is running.
		const isAppRunning = true;
		let result: string[];
		if (device.deviceInfo.platform === this.$devicePlatformsConstants.iOS) {
			debugOptions.chrome = true;
			if (device.isEmulator && !debugData.pathToAppPackage) {
				this.$errors.failWithoutHelp("To debug on iOS simulator you need to provide path to the app package.");
			}

			if (this.$hostInfo.isWindows) {
				if (!isAppRunning) {
					this.$errors.failWithoutHelp(`Application ${debugData.applicationIdentifier} is not running. To be able to debug the application on Windows you must run it.`);
				}

				debugOptions.emulator = false;
			} else if (!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp(`Debugging on iOS devices is not supported for ${platform()} yet.`);
			}

			result = await debugService.debug(debugData, debugOptions);
		} else if (device.deviceInfo.platform === this.$devicePlatformsConstants.Android) {
			debugOptions.client = true;
			result = await debugService.debug(debugData, debugOptions);
		}

		return _.first(result);
	}

	private getDebugService(device: Mobile.IDevice): IPlatformDebugService {
		if (device.deviceInfo.platform === this.$devicePlatformsConstants.iOS) {
			return this.$iOSDebugService;
		} else if (device.deviceInfo.platform === this.$devicePlatformsConstants.Android) {
			return this.$androidDebugService;
		}
	}
}

$injector.register("debugService", DebugService);
