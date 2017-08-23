import { platform } from "os";
import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME, DebugCommandErrors } from "../constants";
import { CONNECTED_STATUS } from "../common/constants";

export class DebugService extends EventEmitter implements IDebugService {
	private _platformDebugServices: IDictionary<IPlatformDebugService>;
	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $injector: IInjector,
		private $hostInfo: IHostInfo,
		private $mobileHelper: Mobile.IMobileHelper) {
		super();
		this._platformDebugServices = {};
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

		const debugOptions: IDebugOptions = _.cloneDeep(options);

		// TODO: Check if app is running.
		// For now we can only check if app is running on Android.
		// After we find a way to check on iOS we should use it here.
		let result: string;

		const debugService = this.getDebugService(device);
		if (!debugService) {
			this.$errors.failWithoutHelp(`Unsupported device OS: ${device.deviceInfo.platform}. You can debug your applications only on iOS or Android.`);
		}

		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			if (device.isEmulator && !debugData.pathToAppPackage && debugOptions.debugBrk) {
				this.$errors.failWithoutHelp("To debug on iOS simulator you need to provide path to the app package.");
			}

			if (this.$hostInfo.isWindows) {
				debugOptions.emulator = false;
			} else if (!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp(`Debugging on iOS devices is not supported for ${platform()} yet.`);
			}

			result = await debugService.debug(debugData, debugOptions);
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			result = await debugService.debug(debugData, debugOptions);
		}

		return result;
	}

	public debugStop(deviceIdentifier: string): Promise<void> {
		const debugService = this.getDebugServiceByIdentifier(deviceIdentifier);
		return debugService.debugStop();
	}

	protected getDebugService(device: Mobile.IDevice): IPlatformDebugService {
		if (!this._platformDebugServices[device.deviceInfo.identifier]) {
			const platform = device.deviceInfo.platform;
			if (this.$mobileHelper.isiOSPlatform(platform)) {
				this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("iOSDebugService", { device });
			} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
				this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("androidDebugService", { device });
			} else {
				this.$errors.failWithoutHelp(DebugCommandErrors.UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING);
			}

			this.attachConnectionErrorHandlers(this._platformDebugServices[device.deviceInfo.identifier]);
		}

		return this._platformDebugServices[device.deviceInfo.identifier];
	}

	private getDebugServiceByIdentifier(deviceIdentifier: string): IPlatformDebugService {
		const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
		return this.getDebugService(device);
	}

	private attachConnectionErrorHandlers(platformDebugService: IPlatformDebugService) {
		let connectionErrorHandler = (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e);
		connectionErrorHandler = connectionErrorHandler.bind(this);
		platformDebugService.on(CONNECTION_ERROR_EVENT_NAME, connectionErrorHandler);
	}
}

$injector.register("debugService", DebugService);
