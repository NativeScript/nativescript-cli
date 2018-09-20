import { DeviceDiscovery } from "./device-discovery";
import { IOSSimulator } from "./../ios/simulator/ios-simulator-device";
import { EmulatorDiscoveryNames } from "../../constants";

export class IOSSimulatorDiscovery extends DeviceDiscovery {
	private cachedSimulators: Mobile.IiSimDevice[] = [];
	private availableSimulators: IDictionary<Mobile.IDeviceInfo> = {};

	constructor(private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService) {
		super();
	}

	public async startLookingForDevices(options?: Mobile.IDeviceLookingOptions): Promise<void> {
		if (options && options.platform && !this.$mobileHelper.isiOSPlatform(options.platform)) {
			return;
		}

		return this.checkForDevices();
	}

	private async checkForDevices(): Promise<void> {
		if (this.$hostInfo.isDarwin) {
			const currentSimulators: Mobile.IiSimDevice[] = await this.$iOSSimResolver.iOSSim.getRunningSimulators();

			// Remove old simulators
			_(this.cachedSimulators)
				.reject(s => _.find(currentSimulators, simulator => simulator && s && simulator.id === s.id && simulator.state === s.state))
				.each(s => this.deleteAndRemoveDevice(s));

			// Add new simulators
			_(currentSimulators)
				.reject(s => _.find(this.cachedSimulators, simulator => simulator && s && simulator.id === s.id && simulator.state === s.state))
				.each(s => this.createAndAddDevice(s));
		}
	}

	public async checkForAvailableSimulators(): Promise<Mobile.IDeviceInfo[]> {
		if (!this.$hostInfo.isDarwin) {
			return [];
		}

		const simulators = (await this.$iOSEmulatorServices.getEmulatorImages()).devices;
		const currentSimulators = _.values(this.availableSimulators);
		const lostSimulators: Mobile.IDeviceInfo[] = [];
		const foundSimulators: Mobile.IDeviceInfo[] = [];

		for (const simulator of currentSimulators) {
			if (!_.find(this.availableSimulators, s => s.imageIdentifier === simulator.imageIdentifier)) {
				lostSimulators.push(simulator);
			}
		}

		for (const simulator of simulators) {
			if (!this.availableSimulators[simulator.imageIdentifier]) {
				foundSimulators.push(simulator);
			}
		}

		if (lostSimulators.length) {
			this.raiseOnEmulatorImagesLost(lostSimulators);
		}

		if (foundSimulators.length) {
			this.raiseOnEmulatorImagesFound(foundSimulators);
		}

		return simulators;
	}

	private createAndAddDevice(simulator: Mobile.IiSimDevice): void {
		this.cachedSimulators.push(_.cloneDeep(simulator));
		this.addDevice(this.$injector.resolve(IOSSimulator, { simulator: simulator }));
	}

	private deleteAndRemoveDevice(simulator: Mobile.IiSimDevice): void {
		_.remove(this.cachedSimulators, s => s && s.id === simulator.id);
		this.removeDevice(simulator.id);
	}

	private raiseOnEmulatorImagesFound(simulators: Mobile.IDeviceInfo[]) {
		_.forEach(simulators, simulator => {
			this.availableSimulators[simulator.imageIdentifier] = simulator;
			this.emit(EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND, simulator);
		});
	}

	private raiseOnEmulatorImagesLost(simulators: Mobile.IDeviceInfo[]) {
		_.forEach(simulators, simulator => {
			delete this.availableSimulators[simulator.imageIdentifier];
			this.emit(EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST, simulator);
		});
	}
}

$injector.register("iOSSimulatorDiscovery", IOSSimulatorDiscovery);
