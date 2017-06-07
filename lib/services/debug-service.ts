import { platform } from "os";
import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../constants";
import { CONNECTED_STATUS } from "../common/constants";

export class DebugService extends EventEmitter implements IDebugService {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $androidDebugService: IPlatformDebugService,
		private $iOSDebugService: IPlatformDebugService,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $mobileHelper: Mobile.IMobileHelper) {
		super();
		this.attachConnectionErrorHandlers();
	}

	public async debug(debugData: IDebugData, options: IDebugOptions): Promise<string> {
		const device = this.$devicesService.getDeviceByIdentifier(debugData.deviceIdentifier);

		if (!device) {
			this.$errors.failWithoutHelp(`Cannot find device with identifier ${debugData.deviceIdentifier}.`);
		}

		if (device.deviceInfo.status !== CONNECTED_STATUS) {
			this.$errors.failWithoutHelp(`The device with identifier ${debugData.deviceIdentifier} is unreachable. Make sure it is Trusted and try again.`);
		}

		if (!(await device.applicationManager.isApplicationInstalled(debugData.applicationIdentifier))) {
			this.$errors.failWithoutHelp(`The application ${debugData.applicationIdentifier} is not installed on device with identifier ${debugData.deviceIdentifier}.`);
		}

		const debugOptions: IDebugOptions = _.merge({}, options);
		debugOptions.start = true;

		// TODO: Check if app is running.
		// For now we can only check if app is running on Android.
		// After we find a way to check on iOS we should use it here.
		const isAppRunning = true;
		let result: string[];
		debugOptions.chrome = true;

		const debugService = this.getDebugService(device);
		if (!debugService) {
			this.$errors.failWithoutHelp(`Unsupported device OS: ${device.deviceInfo.platform}. You can debug your applications only on iOS or Android.`);
		}

		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			if (device.isEmulator && !debugData.pathToAppPackage && debugOptions.debugBrk) {
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

			result = await debugService.debug<string[]>(debugData, debugOptions);
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			result = await debugService.debug<string[]>(debugData, debugOptions);
		}

		return _.first(result);
	}

	public getDebugService(device: Mobile.IDevice): IPlatformDebugService {
		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			return this.$iOSDebugService;
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			return this.$androidDebugService;
		}
	}

	private attachConnectionErrorHandlers() {
		let connectionErrorHandler = (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e);
		connectionErrorHandler = connectionErrorHandler.bind(this);
		this.$androidDebugService.on(CONNECTION_ERROR_EVENT_NAME, connectionErrorHandler);
		this.$iOSDebugService.on(CONNECTION_ERROR_EVENT_NAME, connectionErrorHandler);
	}
}

$injector.register("debugService", DebugService);
