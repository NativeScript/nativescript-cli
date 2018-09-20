import { DeviceAndroidDebugBridge } from "./device-android-debug-bridge";
import * as applicationManagerPath from "./android-application-manager";
import * as fileSystemPath from "./android-device-file-system";
import * as constants from "../../constants";
import { cache } from "../../decorators";

interface IAndroidDeviceDetails {
	model: string;
	name: string;
	release: string;
	brand: string;
}

interface IAdbDeviceStatusInfo {
	errorHelp: string;
	deviceStatus: string;
}

export class AndroidDevice implements Mobile.IAndroidDevice {
	public adb: Mobile.IDeviceAndroidDebugBridge;
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	// http://stackoverflow.com/questions/31178195/what-does-adb-device-status-mean
	private static ADB_DEVICE_STATUS_INFO: IDictionary<IAdbDeviceStatusInfo> = {
		"device": {
			errorHelp: null,
			deviceStatus: constants.CONNECTED_STATUS
		},
		"offline": {
			errorHelp: "The device instance is not connected to adb or is not responding.",
			deviceStatus: constants.UNREACHABLE_STATUS
		},
		"unauthorized": {
			errorHelp: "Allow USB Debugging on your device.",
			deviceStatus: constants.UNREACHABLE_STATUS
		},
		"recovery": {
			errorHelp: "Your device is in recovery mode. This mode is used to recover your phone when it is broken or to install custom roms.",
			deviceStatus: constants.UNREACHABLE_STATUS
		},
		"no permissions": {
			errorHelp: "Insufficient permissions to communicate with the device.",
			deviceStatus: constants.UNREACHABLE_STATUS
		},
	};

	constructor(private identifier: string,
		private status: string,
		private $androidEmulatorServices: Mobile.IEmulatorPlatformService,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logcatHelper: Mobile.ILogcatHelper,
		private $injector: IInjector) { }

	@cache()
	public async init(): Promise<void> {
		this.adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.identifier });
		this.applicationManager = this.$injector.resolve(applicationManagerPath.AndroidApplicationManager, { adb: this.adb, identifier: this.identifier });
		this.fileSystem = this.$injector.resolve(fileSystemPath.AndroidDeviceFileSystem, { adb: this.adb });
		let details = await this.getDeviceDetails(["getprop"]);

		if (!details || !details.name) {
			// In older CLI versions we are calling cat /system/build.prop to get details.
			// Keep this logic for compatibility and possibly for devices for which getprop is not working
			details = await this.getDeviceDetails(["cat", "/system/build.prop"]);
		}

		this.$logger.trace(details);
		const adbStatusInfo = AndroidDevice.ADB_DEVICE_STATUS_INFO[this.status];
		const type = await this.getType();

		this.deviceInfo = {
			identifier: this.identifier,
			displayName: details.name,
			model: details.model,
			version: details.release,
			vendor: details.brand,
			platform: this.$devicePlatformsConstants.Android,
			status: adbStatusInfo ? adbStatusInfo.deviceStatus : this.status,
			errorHelp: adbStatusInfo ? adbStatusInfo.errorHelp : "Unknown status",
			isTablet: this.getIsTablet(details),
			type
		};

		if (this.isEmulator) {
			this.deviceInfo.displayName = await this.$androidEmulatorServices.getRunningEmulatorName(this.identifier);
			this.deviceInfo.imageIdentifier = await this.$androidEmulatorServices.getRunningEmulatorImageIdentifier(this.identifier);
		}

		this.$logger.trace(this.deviceInfo);
	}

	public get isEmulator(): boolean {
		return this.deviceInfo.type === constants.DeviceTypes.Emulator;
	}

	public async getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		const files = await this.fileSystem.listFiles(constants.LiveSyncConstants.ANDROID_FILES_PATH, applicationIdentifier);
		const androidFilesMatch = files.match(/(\S+)\.abproject/);
		let result: Mobile.IApplicationInfo = null;

		if (androidFilesMatch && androidFilesMatch[1]) {
			result = {
				deviceIdentifier: this.deviceInfo.identifier,
				configuration: androidFilesMatch[1],
				applicationIdentifier
			};
		}

		return result;
	}

	public async openDeviceLogStream(): Promise<void> {
		if (this.deviceInfo.status === constants.CONNECTED_STATUS) {
			await this.$logcatHelper.start({
				deviceIdentifier: this.identifier,
				keepSingleProcess: true
			});
		}
	}

	private async getDeviceDetails(shellCommandArgs: string[]): Promise<IAndroidDeviceDetails> {
		const parsedDetails: any = {};

		this.$logger.trace(`Trying to get information for Android device. Command is: ${shellCommandArgs}`);

		try {
			const details = await this.adb.executeShellCommand(shellCommandArgs);

			details.split(/\r?\n|\r/).forEach((value: any) => {
				// sample line is "ro.build.version.release=4.4" in /system/build.prop
				// sample line from getprop is:  [ro.build.version.release]: [6.0]
				// NOTE: some props do not have value: [ro.build.version.base_os]: []
				const match = /(?:\[?ro\.build\.version|ro\.product|ro\.build)\.(.+?)]?(?:\:|=)(?:\s*?\[)?(.*?)]?$/.exec(value);
				if (match) {
					parsedDetails[match[1]] = match[2];
				}
			});
		} catch (err) {
			this.$logger.trace(`Error while getting details from Android device. Command is: ${shellCommandArgs}. Error is: ${err}`);
		}

		this.$logger.trace(parsedDetails);

		return parsedDetails;
	}

	private getIsTablet(details: any): boolean {
		//version 3.x.x (also known as Honeycomb) is a tablet only version
		return details && (_.startsWith(details.release, "3.") || _.includes((details.characteristics || '').toLowerCase(), "tablet"));
	}

	private async getType(): Promise<string> {
		const runningEmulatorIds = await this.$androidEmulatorServices.getRunningEmulatorIds();
		if (_.find(runningEmulatorIds, emulatorId => emulatorId === this.identifier)) {
			return constants.DeviceTypes.Emulator;
		}

		return constants.DeviceTypes.Device;
	}
}
