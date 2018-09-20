import { EventEmitter } from "events";
import { EmulatorDiscoveryNames } from "../../constants";

export class AndroidEmulatorDiscovery extends EventEmitter implements Mobile.IDeviceDiscovery {
	private _emulators: IDictionary<Mobile.IDeviceInfo> = {};

	constructor(private $androidEmulatorServices: Mobile.IEmulatorPlatformService,
		private $mobileHelper: Mobile.IMobileHelper) { super(); }

	public async startLookingForDevices(options?: Mobile.IDeviceLookingOptions): Promise<void> {
		if (options && options.platform && !this.$mobileHelper.isAndroidPlatform(options.platform)) {
			return;
		}

		const availableEmulatorsOutput = await this.$androidEmulatorServices.getEmulatorImages();
		const currentEmulators = availableEmulatorsOutput.devices;
		const cachedEmulators = _.values(this._emulators);

		// Remove old emulators
		const lostEmulators = _(cachedEmulators)
			.reject(e => _.find(currentEmulators, emulator => emulator && e && emulator.imageIdentifier === e.imageIdentifier))
			.value();

		// Add new emulators
		const foundEmulators = _(currentEmulators)
			.reject(e => _.find(cachedEmulators, emulator => emulator && e && emulator.imageIdentifier === e.imageIdentifier))
			.value();

		if (lostEmulators.length) {
			this.raiseOnEmulatorImagesLost(lostEmulators);
		}

		if (foundEmulators.length) {
			this.raiseOnEmulatorImagesFound(foundEmulators);
		}
	}

	public getDevices(): Mobile.IDeviceInfo[] {
		return _.values(this._emulators);
	}

	private raiseOnEmulatorImagesFound(emulators: Mobile.IDeviceInfo[]) {
		_.forEach(emulators, emulator => {
			this._emulators[emulator.imageIdentifier] = emulator;
			this.emit(EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND, emulator);
		});
	}

	private raiseOnEmulatorImagesLost(emulators: Mobile.IDeviceInfo[]) {
		_.forEach(emulators, emulator => {
			delete this._emulators[emulator.imageIdentifier];
			this.emit(EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST, emulator);
		});
	}
}
$injector.register("androidEmulatorDiscovery", AndroidEmulatorDiscovery);
