import * as path from "path";
import { createTable, deferPromise } from "../common/helpers";

export class EmulatorPlatformService implements IEmulatorPlatformService {

	constructor(
		private $mobileHelper: Mobile.IMobileHelper,
		private $childProcess: IChildProcess,
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions,
		private $logger: ILogger) { }

	public async startEmulator(info: IEmulatorInfo, projectData: IProjectData): Promise<void> {
		if (!info.isRunning) {
			if (this.$mobileHelper.isAndroidPlatform(info.platform)) {
				this.$options.avd = this.$options.device;
				this.$options.device = null;
				let platformsData: IPlatformsData = $injector.resolve("platformsData");
				let platformData = platformsData.getPlatformData(info.platform, projectData);
				let emulatorServices = platformData.emulatorServices;
				emulatorServices.checkAvailability();
				await emulatorServices.checkDependencies();
				await emulatorServices.startEmulator();
				this.$options.avd = null;
				return;
			}

			if (this.$mobileHelper.isiOSPlatform(info.platform)) {
				await this.stopEmulator(info.platform);
				let deferred = deferPromise<void>();
				await this.$childProcess.exec(`open -a Simulator --args -CurrentDeviceUDID ${info.id}`);
				let timeoutFunc = async () => {
					info = await this.getEmulatorInfo("ios", info.id);
					if (info.isRunning) {
						await this.$devicesService.initialize({ platform: info.platform, deviceId: info.id });
						let device = this.$devicesService.getDeviceByIdentifier(info.id);
						await device.applicationManager.checkForApplicationUpdates();
						deferred.resolve();
						return;
					}

					setTimeout(timeoutFunc, 2000);
				};
				await timeoutFunc();
				return deferred.promise;
			}
		}
	}

	private async stopEmulator(platform: string): Promise<void> {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			await this.$childProcess.exec("pkill -9 -f Simulator");
		}
	}

	public async getEmulatorInfo(platform: string, idOrName: string): Promise<IEmulatorInfo> {
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			let androidEmulators = await this.getAndroidEmulators();
			let found = androidEmulators.filter((info: IEmulatorInfo) => info.id === idOrName);
			if (found.length > 0) {
				return found[0];
			}

			await this.$devicesService.initialize({ platform: platform, deviceId: null, skipInferPlatform: true });
			let info: IEmulatorInfo = null;
			let action = async (device: Mobile.IDevice) => {
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
			};
			await this.$devicesService.execute(action, undefined, { allowNoDevices: true });
			return info;
		}

		if (this.$mobileHelper.isiOSPlatform(platform)) {
			let emulators = await this.getiOSEmulators();
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

	}

	public async listAvailableEmulators(platform: string): Promise<void> {
		let emulators: IEmulatorInfo[] = [];
		if (!platform || this.$mobileHelper.isiOSPlatform(platform)) {
			let iosEmulators = await this.getiOSEmulators();
			if (iosEmulators) {
				emulators = emulators.concat(iosEmulators);
			}
		}

		if (!platform || this.$mobileHelper.isAndroidPlatform(platform)) {
			let androidEmulators = await this.getAndroidEmulators();
			if (androidEmulators) {
				emulators = emulators.concat(androidEmulators);
			}
		}

		this.outputEmulators("\nAvailable emulators", emulators);
		this.$logger.out("\nConnected devices & emulators");
		await $injector.resolveCommand("device").execute(platform ? [platform] : []);
	}

	public async getiOSEmulators(): Promise<IEmulatorInfo[]> {
		let output = await this.$childProcess.exec("xcrun simctl list --json");
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
	}

	public async getAndroidEmulators(): Promise<IEmulatorInfo[]> {
		let androidPath = path.join(process.env.ANDROID_HOME, "tools", "android");
		let text: string = await this.$childProcess.exec(`"${androidPath}" list avd`);
		let notLoadedIndex = text.indexOf("The following");
		if (notLoadedIndex > 0) {
			text = text.substring(0, notLoadedIndex);
		}

		let textBlocks = text.split("---------");
		let emulators: IEmulatorInfo[] = [];
		for (let block of textBlocks) {
			let lines = block.split("\n");
			let info: IEmulatorInfo = { name: "", version: "", id: "", platform: "Android", type: "Emulator" };
			for (let line of lines) {
				if (line.indexOf("Target") >= 0) {
					info.version = line.substring(line.indexOf(":") + 1).replace("Android", "").trim();
				}

				if (line.indexOf("Name") >= 0) {
					info.id = line.substring(line.indexOf(":") + 1).trim();
				}

				if (line.indexOf("Device") >= 0) {
					info.name = line.substring(line.indexOf(":") + 1).trim();
				}

				info.isRunning = false;
			}

			emulators.push(info);
		}

		return emulators;
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
