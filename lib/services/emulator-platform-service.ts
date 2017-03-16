import * as fiberBootstrap from "../common/fiber-bootstrap";
import { createTable } from "../common/helpers";
import Future = require("fibers/future");

export class EmulatorPlatformService implements IEmulatorPlatformService {

	constructor(
		private $mobileHelper: Mobile.IMobileHelper,
		private $childProcess: IChildProcess,
		private $devicesService: Mobile.IDevicesService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $dispatcher: IFutureDispatcher,
		private $options: IOptions,
		private $logger: ILogger,
		private $androidEmulatorServices: Mobile.IAndroidEmulatorServices) { }

	public startEmulator(info: IEmulatorInfo): IFuture<void> {
		if (!info.isRunning) {

			if (this.$mobileHelper.isAndroidPlatform(info.platform)) {
				this.$options.avd = this.$options.device;
				this.$options.device = null;
				let platformsData: IPlatformsData = $injector.resolve("platformsData");
				let platformData = platformsData.getPlatformData(info.platform);
				let emulatorServices = platformData.emulatorServices;
				emulatorServices.checkAvailability();
				emulatorServices.checkDependencies().wait();
				emulatorServices.startEmulator().wait();
				this.$options.avd = null;
				return Future.fromResult();
			}

			if (this.$mobileHelper.isiOSPlatform(info.platform)) {
				this.stopEmulator(info.platform).wait();
				let future = new Future<void>();
				this.$childProcess.exec(`open -a Simulator --args -CurrentDeviceUDID ${info.id}`).wait();
				let timeoutFunc = () => {
					fiberBootstrap.run(() => {
						info = this.getEmulatorInfo("ios", info.id).wait();
						if (info.isRunning) {
							this.$devicesService.initialize({ platform: info.platform, deviceId: info.id }).wait();
							let device = this.$devicesService.getDeviceByIdentifier(info.id);
							device.applicationManager.checkForApplicationUpdates().wait();
							future.return();
							return;
						}
						setTimeout(timeoutFunc, 2000);
					});
				};
				timeoutFunc();
				return future;
			}
		}

		return Future.fromResult();
	}

	private stopEmulator(platform: string): IFuture<void> {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$childProcess.exec("pkill -9 -f Simulator");
		}
		return Future.fromResult();
	}

	public getEmulatorInfo(platform: string, idOrName: string): IFuture<IEmulatorInfo> {
		return (() => {

			if (this.$mobileHelper.isAndroidPlatform(platform)) {
				let androidEmulators = this.getAndroidEmulators().wait();
				let found = androidEmulators.filter((info: IEmulatorInfo) => info.id === idOrName);
				if (found.length > 0) {
					return found[0];
				}
				this.$devicesService.initialize({ platform: platform, deviceId: null, skipInferPlatform: true }).wait();
				let info: IEmulatorInfo = null;
				let action = (device: Mobile.IDevice) => {
					return (() => {
						if (device.deviceInfo.identifier === idOrName) {
							info = {
								id: device.deviceInfo.identifier,
								name: device.deviceInfo.displayName,
								version: device.deviceInfo.version,
								platform: "Android",
								type: "emulator",
								isRunning: true
							};
						}
					}).future<void>()();
				};
				this.$devicesService.execute(action, undefined, { allowNoDevices: true }).wait();
				return info;
			}

			if (this.$mobileHelper.isiOSPlatform(platform)) {
				let emulators = this.getiOSEmulators().wait();
				let sdk: string = null;
				let versionStart = idOrName.indexOf("(");
				if (versionStart > 0) {
					sdk = idOrName.substring(versionStart + 1, idOrName.indexOf(")", versionStart)).trim();
					idOrName = idOrName.substring(0, versionStart - 1).trim();
				}
				let found = emulators.filter((info: IEmulatorInfo) => {
					let sdkMatch = sdk ? info.version === sdk : true;
					return sdkMatch && info.id === idOrName || info.name === idOrName;
				});
				return found.length > 0 ? found[0] : null;
			}

			return null;

		}).future<IEmulatorInfo>()();
	}

	public listAvailableEmulators(platform: string): IFuture<void> {
		return (() => {
			let emulators: IEmulatorInfo[] = [];
			if (!platform || this.$mobileHelper.isiOSPlatform(platform)) {
				let iosEmulators = this.getiOSEmulators().wait();
				if (iosEmulators) {
					emulators = emulators.concat(iosEmulators);
				}
			}
			if (!platform || this.$mobileHelper.isAndroidPlatform(platform)) {
				let androidEmulators = this.getAndroidEmulators().wait();
				if (androidEmulators) {
					emulators = emulators.concat(androidEmulators);
				}
			}
			this.outputEmulators("\nAvailable emulators", emulators);
			this.$logger.out("\nConnected devices & emulators");
			$injector.resolveCommand("device").execute(platform ? [platform] : []).wait();
		}).future<void>()();
	}

	public getiOSEmulators(): IFuture<IEmulatorInfo[]> {
		return (() => {
			let output = this.$childProcess.exec("xcrun simctl list --json").wait();
			let list = JSON.parse(output);
			let emulators: IEmulatorInfo[] = [];
			for (let osName in list["devices"]) {
				if (osName.indexOf("iOS") === -1) {
					continue;
				}
				let os = list["devices"][osName];
				let version = this.parseiOSVersion(osName);
				for (let device of os) {
					if (device["availability"] !== "(available)") {
						continue;
					}
					let emulatorInfo: IEmulatorInfo = {
						id: device["udid"],
						name: device["name"],
						isRunning: device["state"] === "Booted",
						type: "simulator",
						version: version,
						platform: "iOS"
					};
					emulators.push(emulatorInfo);
				}
			}
			return emulators;
		}).future<IEmulatorInfo[]>()();
	}

	public getAndroidEmulators(): IFuture<IEmulatorInfo[]> {
		return (() => {
			const androidVirtualDevices: Mobile.IAvdInfo[] = this.$androidEmulatorServices.getAvds().map(avd => this.$androidEmulatorServices.getInfoFromAvd(avd));
			const emulators: IEmulatorInfo[] = _.map(androidVirtualDevices, avd => {
				return { name: avd.device, version: avd.target, id: avd.name, platform: "Android", type: "Emulator", isRunning: false };
			});

			return emulators;
		}).future<IEmulatorInfo[]>()();
	}

	private parseiOSVersion(osName: string): string {
		osName = osName.replace("com.apple.CoreSimulator.SimRuntime.iOS-", "");
		osName = osName.replace(/-/g, ".");
		osName = osName.replace("iOS", "");
		osName = osName.trim();
		return osName;
	}

	private outputEmulators(title: string, emulators: IEmulatorInfo[]) {
		this.$logger.out(title);
		let table: any = createTable(["Device Name", "Platform", "Version", "Device Identifier"], []);
		for (let info of emulators) {
			table.push([info.name, info.platform, info.version, info.id]);
		}
		this.$logger.out(table.toString());
	}
}
$injector.register("emulatorPlatformService", EmulatorPlatformService);
