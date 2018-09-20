import { RUNNING_EMULATOR_STATUS, DeviceTypes } from "../constants";

export class EmulatorHelper implements Mobile.IEmulatorHelper {
	// https://developer.android.com/guide/topics/manifest/uses-sdk-element
	public mapAndroidApiLevelToVersion = {
		"android-28": "9.0.0",
		"android-27": "8.1.0",
		"android-26": "8.0.0",
		"android-25": "7.1.1",
		"android-24": "7.0.0",
		"android-23": "6.0.0",
		"android-22": "5.1.0",
		"android-21": "5.0.0",
		"android-20": "4.4.0",
		"android-19": "4.4.0",
		"android-18": "4.3.0",
		"android-17": "4.2.2"
	};

	public getEmulatorsFromAvailableEmulatorsOutput(availableEmulatorsOutput: Mobile.IListEmulatorsOutput): Mobile.IDeviceInfo[] {
		return <Mobile.IDeviceInfo[]>(_(availableEmulatorsOutput)
			.valuesIn()
			.map((value: Mobile.IEmulatorImagesOutput) => value.devices)
			.concat()
			.flatten()
			.value());
	}

	public getErrorsFromAvailableEmulatorsOutput(availableEmulatorsOutput: Mobile.IListEmulatorsOutput): string[] {
		return <string[]>(_(availableEmulatorsOutput)
			.valuesIn()
			.map((value: Mobile.IEmulatorImagesOutput) => value.errors)
			.concat()
			.flatten()
			.value());
	}

	public getEmulatorByImageIdentifier(imageIdentifier: string, emulators: Mobile.IDeviceInfo[]): Mobile.IDeviceInfo {
		const imagerIdentifierLowerCase = imageIdentifier && imageIdentifier.toLowerCase();
		return _.find(emulators, emulator => emulator && emulator.imageIdentifier && imageIdentifier && emulator.imageIdentifier.toLowerCase() === imagerIdentifierLowerCase);
	}

	public getEmulatorByIdOrName(emulatorIdOrName: string, emulators: Mobile.IDeviceInfo[]): Mobile.IDeviceInfo {
		const emulatorIdOrNameLowerCase = emulatorIdOrName && emulatorIdOrName.toLowerCase();
		return _.find(emulators, emulator => emulator && emulatorIdOrNameLowerCase && ((emulator.identifier && emulator.identifier.toLowerCase() === emulatorIdOrNameLowerCase) || emulator.displayName.toLowerCase() === emulatorIdOrNameLowerCase));
	}

	public isEmulatorRunning(emulator: Mobile.IDeviceInfo): boolean {
		return emulator && emulator.status === RUNNING_EMULATOR_STATUS;
	}

	public getEmulatorByStartEmulatorOptions(options: Mobile.IStartEmulatorOptions, emulators: Mobile.IDeviceInfo[]): Mobile.IDeviceInfo {
		let result: Mobile.IDeviceInfo = null;

		if (options.emulator) {
			result = options.emulator;
		}

		if (!result && options.imageIdentifier) {
			result = this.getEmulatorByImageIdentifier(options.imageIdentifier, emulators);
		}

		if (!result && options.emulatorIdOrName) {
			result = this.getEmulatorByIdOrName(options.emulatorIdOrName, emulators);
		}

		return result;
	}

	public setRunningAndroidEmulatorProperties(emulatorId: string, emulator: Mobile.IDeviceInfo): void {
		emulator.identifier = emulatorId;
		emulator.status = RUNNING_EMULATOR_STATUS;
		emulator.type = DeviceTypes.Device;
		//emulator.isTablet; // TODO: consider to do this here!!!
	}
}
$injector.register("emulatorHelper", EmulatorHelper);
