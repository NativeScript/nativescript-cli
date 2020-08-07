import { DeviceAndroidDebugBridge } from "./device-android-debug-bridge";
import * as applicationManagerPath from "./android-application-manager";
import * as fileSystemPath from "./android-device-file-system";
import * as constants from "../../constants";
import { cache } from "../../decorators";
import { DeviceConnectionType } from "../../../constants";
import { IDictionary } from "../../declarations";

import * as _ from "lodash";

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
	public fileSystem: Mobile.IAndroidDeviceFileSystem;
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
				private $logcatHelper: Mobile.ILogcatHelper) {
	}

	@cache()
	public async init(): Promise<void> {
		this.adb = $injector.resolve(DeviceAndroidDebugBridge, {identifier: this.identifier});
		this.applicationManager = $injector.resolve(applicationManagerPath.AndroidApplicationManager, {
			adb: this.adb,
			identifier: this.identifier
		});
		this.fileSystem = $injector.resolve(fileSystemPath.AndroidDeviceFileSystem, {adb: this.adb});
		let details = await this.getDeviceDetails(["getprop"]);

		if (!details || !details.name) {
			// In older CLI versions we are calling cat /system/build.prop to get details.
			// Keep this logic for compatibility and possibly for devices for which getprop is not working
			details = await this.getDeviceDetails(["cat", "/system/build.prop"]);
		}

		this.$logger.trace(details);
		const adbStatusInfo = AndroidDevice.ADB_DEVICE_STATUS_INFO[this.status];
		const type = await this.getType();

		let version = details.release;
		if (version && version.toLowerCase() === 'q') {
			version = '10.0.0';
		}

		this.deviceInfo = {
			identifier: this.identifier,
			displayName: details.name,
			model: details.model,
			version,
			vendor: details.brand,
			platform: this.$devicePlatformsConstants.Android,
			status: adbStatusInfo ? adbStatusInfo.deviceStatus : this.status,
			errorHelp: adbStatusInfo ? adbStatusInfo.errorHelp : "Unknown status",
			isTablet: this.getIsTablet(details),
			type,
			connectionTypes: [DeviceConnectionType.Local]
		};

		this.deviceInfo.connectionTypes = this.isEmulator ? [DeviceConnectionType.Local] : [DeviceConnectionType.USB];

		if (this.isEmulator) {
			this.deviceInfo.displayName = await this.$androidEmulatorServices.getRunningEmulatorName(this.identifier);
			this.deviceInfo.imageIdentifier = await this.$androidEmulatorServices.getRunningEmulatorImageIdentifier(this.identifier);
		}

		this.$logger.trace(this.deviceInfo);
	}

	public get isEmulator(): boolean {
		return this.deviceInfo.type === constants.DeviceTypes.Emulator;
	}

	public get isOnlyWiFiConnected(): boolean {
		return false;
	}

	public async openDeviceLogStream(): Promise<void> {
		if (this.deviceInfo.status === constants.CONNECTED_STATUS) {
			await this.$logcatHelper.start({
				deviceIdentifier: this.identifier,
				keepSingleProcess: true
			});
		}
	}

	public detach(): void {
		if (this.isEmulator) {
			this.$androidEmulatorServices.detach(this.deviceInfo);
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
