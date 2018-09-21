import { AndroidVirtualDevice, DeviceTypes, NOT_RUNNING_EMULATOR_STATUS } from "../../../constants";
import { settlePromises } from "../../../helpers";
import { EOL } from "os";
import * as path from "path";
import * as osenv from "osenv";
import { cache } from "../../../decorators";

export class AndroidGenymotionService implements Mobile.IAndroidVirtualDeviceService {
	constructor(private $adb: Mobile.IAndroidDebugBridge,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $virtualBoxService: Mobile.IVirtualBoxService) { }

	public async getEmulatorImages(adbDevicesOutput: string[]): Promise<Mobile.IEmulatorImagesOutput> {
		const availableEmulatorsOutput = await this.getEmulatorImagesCore();
		const runningEmulatorIds = await this.getRunningEmulatorIds(adbDevicesOutput);
		const runningEmulators = await settlePromises(_.map(runningEmulatorIds, emulatorId => this.getRunningEmulatorData(emulatorId, availableEmulatorsOutput.devices)));
		const devices = availableEmulatorsOutput.devices.map(emulator => this.$emulatorHelper.getEmulatorByImageIdentifier(emulator.imageIdentifier, runningEmulators) || emulator);
		return {
			devices,
			errors: availableEmulatorsOutput.errors
		};
	}

	public async getRunningEmulatorIds(adbDevicesOutput: string[]): Promise<string[]> {
		const results = await Promise.all<string>(
			<Promise<string>[]>(_(adbDevicesOutput)
				.filter(r => !r.match(AndroidVirtualDevice.RUNNING_AVD_EMULATOR_REGEX))
				.map(async row => {
					const match = row.match(/^(.+?)\s+device$/);
					if (match && match[1]) {
						// possible genymotion emulator
						const emulatorId = match[1];
						const result = await this.isGenymotionEmulator(emulatorId) ? emulatorId : undefined;
						return Promise.resolve(result);
					}

					return Promise.resolve(undefined);
				}).value())
		);

		return _(results).filter(r => !!r)
			.map(r => r.toString())
			.value();
	}

	public get pathToEmulatorExecutable(): string {
		const searchPaths = this.playerSearchPaths[process.platform];
		const searchPath = _.find(searchPaths, sPath => this.$fs.exists(sPath));
		return searchPath || "player";
	}

	public startEmulatorArgs(imageIdentifier: string): string[] {
		return ["--vm-name", imageIdentifier];
	}

	private async getEmulatorImagesCore(): Promise<Mobile.IEmulatorImagesOutput> {
		const output = await this.$virtualBoxService.listVms();
		if (output.error) {
			return { devices: [], errors: output.error ? [output.error] : [] };
		}

		const devices = await this.parseListVmsOutput(output.vms);
		return { devices, errors: [] };
	}

	public async getRunningEmulatorName(emulatorId: string): Promise<string> {
		const output = await this.$adb.getPropertyValue(emulatorId, "ro.product.model");
		this.$logger.trace(output);
		return (<string>_.first(output.split(EOL))).trim();
	}

	public async getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string> {
		const adbDevices = await this.$adb.getDevicesSafe();
		const emulatorImages = (await this.getEmulatorImages(adbDevices)).devices;
		const emulator = await this.getRunningEmulatorData(emulatorId, emulatorImages);
		return emulator ? emulator.imageIdentifier : null;
	}

	private async getRunningEmulatorData(runningEmulatorId: string, availableEmulators: Mobile.IDeviceInfo[]): Promise<Mobile.IDeviceInfo> {
		const emulatorName = await this.getRunningEmulatorName(runningEmulatorId);
		const runningEmulator = this.$emulatorHelper.getEmulatorByIdOrName(emulatorName, availableEmulators);
		if (!runningEmulator) {
			return null;
		}

		this.$emulatorHelper.setRunningAndroidEmulatorProperties(runningEmulatorId, runningEmulator);

		return runningEmulator;
	}

	// https://wiki.appcelerator.org/display/guides2/Installing+Genymotion
	private get playerSearchPaths(): IDictionary<string[]> {
		return {
			darwin: [
				"/Applications/Genymotion.app/Contents/MacOS/player.app/Contents/MacOS/player",
				"/Applications/Genymotion.app/Contents/MacOS/player"
			],
			linux: [
				path.join(osenv.home(), "genymotion", "player")
			],
			win32: [
				"%ProgramFiles%\\Genymobile\\Genymotion\\player.exe",
				"%ProgramFiles(x86)%\\Genymobile\\Genymotion\\player.exe"
			]
		};
	}

	private async parseListVmsOutput(vms: Mobile.IVirtualBoxVm[]): Promise<Mobile.IDeviceInfo[]> {
		const configurationError = await this.getConfigurationError();
		const devices: Mobile.IDeviceInfo[] = [];

		for (const vm of vms) {
			try {
				const output = await this.$virtualBoxService.enumerateGuestProperties(vm.id);
				if (output && output.properties && output.properties.indexOf("genymotion") !== -1) {
					devices.push(this.convertToDeviceInfo(output.properties, vm.id, vm.name, output.error, configurationError));
				}
			} catch (err) {
				this.$logger.trace(`Error while parsing vm ${vm.id}`);
			}
		}

		return devices;
	}

	private convertToDeviceInfo(output: string, id: string, name: string, error: string, configurationError: string): Mobile.IDeviceInfo {
		return {
			identifier: null,
			imageIdentifier: id,
			displayName: name,
			model: name,
			version: this.getSdkVersion(output),
			vendor: AndroidVirtualDevice.GENYMOTION_VENDOR_NAME,
			status: NOT_RUNNING_EMULATOR_STATUS,
			errorHelp: [configurationError, error].filter(item => !!item).join(EOL) || null,
			isTablet: false, //TODO: Consider how to populate this correctly when the device is not running
			type: DeviceTypes.Emulator,
			platform: this.$devicePlatformsConstants.Android
		};
	}

	private getSdkVersion(output: string): string {
		// Example -> Name: android_version, value: 6.0.0, timestamp: 1530090506102029000, flags:
		const androidApiLevelRow = output
			.split("\n")
			.filter(row => !!row)
			.find(row => row.indexOf("Name: android_version") !== -1);

		return androidApiLevelRow.split(", ")[1].split("value: ")[1];
	}

	private async isGenymotionEmulator(emulatorId: string): Promise<boolean> {
		const manufacturer = await this.$adb.getPropertyValue(emulatorId, "ro.product.manufacturer");
		if (manufacturer && manufacturer.match(/^Genymotion/i)) {
			return true;
		}

		const buildProduct = await this.$adb.getPropertyValue(emulatorId, "ro.build.product");
		if (buildProduct && _.includes(buildProduct.toLowerCase(), "vbox")) {
			return true;
		}

		return false;
	}

	@cache()
	private getConfigurationPlatformSpecficErrorMessage(): string {
		const searchPaths = this.playerSearchPaths[process.platform];
		return `Unable to find the Genymotion player in the following location${searchPaths.length > 1 ? "s" : ""}:
${searchPaths.join(EOL)}
In case you have installed Genymotion in a different location, please add the path to player executable to your PATH environment variable.`;

	}

	@cache()
	private async getConfigurationError(): Promise<string> {
		const result = await this.$childProcess.trySpawnFromCloseEvent(this.pathToEmulatorExecutable, [], {}, { throwError: false });
		// When player is spawned, it always prints message on stderr.
		if (result && result.stderr && result.stderr.indexOf(AndroidVirtualDevice.GENYMOTION_DEFAULT_STDERR_STRING) === -1) {
			this.$logger.trace("Configuration error for Genymotion", result);
			return this.getConfigurationPlatformSpecficErrorMessage();
		}

		return null;
	}
}
$injector.register("androidGenymotionService", AndroidGenymotionService);
