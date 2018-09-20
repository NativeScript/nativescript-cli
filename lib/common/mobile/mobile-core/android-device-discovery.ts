import { DeviceDiscovery } from "./device-discovery";
import { AndroidDevice } from "../android/android-device";

interface IAdbAndroidDeviceInfo {
	identifier: string;
	status: string;
}

export class AndroidDeviceDiscovery extends DeviceDiscovery implements Mobile.IAndroidDeviceDiscovery {
	private _devices: IAdbAndroidDeviceInfo[] = [];
	private isStarted: boolean;

	constructor(private $injector: IInjector,
		private $adb: Mobile.IAndroidDebugBridge,
		private $mobileHelper: Mobile.IMobileHelper) {
		super();
	}

	private async createAndAddDevice(adbDeviceInfo: IAdbAndroidDeviceInfo): Promise<void> {
		this._devices.push(adbDeviceInfo);
		const device: Mobile.IAndroidDevice = this.$injector.resolve(AndroidDevice, { identifier: adbDeviceInfo.identifier, status: adbDeviceInfo.status });
		await device.init();
		this.addDevice(device);
	}

	private deleteAndRemoveDevice(deviceIdentifier: string): void {
		_.remove(this._devices, d => d.identifier === deviceIdentifier);
		this.removeDevice(deviceIdentifier);
	}

	public async startLookingForDevices(options?: Mobile.IDeviceLookingOptions): Promise<void> {
		if (options && options.platform && !this.$mobileHelper.isAndroidPlatform(options.platform)) {
			return;
		}
		await this.ensureAdbServerStarted();
		await this.checkForDevices();
	}

	private async checkForDevices(): Promise<void> {
		const devices = await this.$adb.getDevices();

		await this.checkCurrentData(devices);
	}

	private async checkCurrentData(result: string[]): Promise<void> {
		const currentDevices: IAdbAndroidDeviceInfo[] = result.map((element: string) => {
			// http://developer.android.com/tools/help/adb.html#devicestatus
			const data = element.split('\t');
			const identifier = data[0];
			const status = data[1];

			return {
				identifier: identifier,
				status: status
			};
		});

		_(this._devices)
			.reject(d => _.find(currentDevices, device => device.identifier === d.identifier && device.status === d.status))
			.each(d => this.deleteAndRemoveDevice(d.identifier));

		await Promise.all(_(currentDevices)
			.reject(d => _.find(this._devices, device => device.identifier === d.identifier && device.status === d.status))
			.map(d => this.createAndAddDevice(d)).value());
	}

	public async ensureAdbServerStarted(): Promise<any> {
		if (!this.isStarted) {
			this.isStarted = true;

			try {
				return await this.$adb.executeCommand(["start-server"]);
			} catch (err) {
				this.isStarted = false;
				throw err;
			}
		}
	}
}

$injector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);
