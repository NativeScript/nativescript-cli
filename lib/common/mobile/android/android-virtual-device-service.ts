import * as net from "net";
import * as path from "path";
import { EOL } from "os";
import * as osenv from "osenv";
import { AndroidVirtualDevice, DeviceTypes, NOT_RUNNING_EMULATOR_STATUS } from "../../constants";
import { cache } from "../../decorators";
import { settlePromises } from "../../helpers";

export class AndroidVirtualDeviceService implements Mobile.IAndroidVirtualDeviceService {
	private androidHome: string;
	private mapEmulatorIdToImageIdentifier: IStringDictionary = {};

	constructor(private $androidIniFileParser: Mobile.IAndroidIniFileParser,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger) {
		this.androidHome = process.env.ANDROID_HOME;
	}

	public async getEmulatorImages(adbDevicesOutput: string[]): Promise<Mobile.IEmulatorImagesOutput> {
		const availableEmulatorsOutput = await this.getEmulatorImagesCore();
		const avds = availableEmulatorsOutput.devices;
		const runningEmulatorIds = await this.getRunningEmulatorIds(adbDevicesOutput);
		const runningEmulators = await settlePromises(_.map(runningEmulatorIds, emulatorId => this.getRunningEmulatorData(emulatorId, avds)));
		const devices = availableEmulatorsOutput.devices.map(emulator => this.$emulatorHelper.getEmulatorByImageIdentifier(emulator.imageIdentifier, runningEmulators) || emulator);
		return {
			devices,
			errors: availableEmulatorsOutput.errors
		};
	}

	public async getRunningEmulatorIds(adbDevicesOutput: string[]): Promise<string[]> {
		const emulatorIds = _.reduce(adbDevicesOutput, (result: string[], device: string) => {
			const rx = device.match(AndroidVirtualDevice.RUNNING_AVD_EMULATOR_REGEX);
			if (rx && rx[1]) {
				result.push(rx[1]);
			}

			return result;
		}, []);

		return emulatorIds;
	}

	public async getRunningEmulatorName(emulatorId: string): Promise<string> {
		const imageIdentifier = await this.getRunningEmulatorImageIdentifier(emulatorId);
		const iniFilePath = path.join(this.pathToAvdHomeDir, `${imageIdentifier}.ini`);
		const iniFileInfo = this.$androidIniFileParser.parseIniFile(iniFilePath);
		let result = imageIdentifier;

		if (iniFileInfo && iniFileInfo.path) {
			const configIniFileInfo = this.$androidIniFileParser.parseIniFile(path.join(iniFileInfo.path, AndroidVirtualDevice.CONFIG_INI_FILE_NAME));
			result = (configIniFileInfo && configIniFileInfo.displayName) || imageIdentifier;
		}

		return result;
	}

	public startEmulatorArgs(imageIdentifier: string): string[] {
		return ['-avd', imageIdentifier];
	}

	@cache()
	public get pathToEmulatorExecutable(): string {
		const emulatorExecutableName = "emulator";
		if (this.androidHome) {
			// Check https://developer.android.com/studio/releases/sdk-tools.html (25.3.0)
			// Since this version of SDK tools, the emulator is a separate package.
			// However the emulator executable still exists in the "tools" dir.
			const pathToEmulatorFromAndroidStudio = path.join(this.androidHome, emulatorExecutableName, emulatorExecutableName);
			const realFilePath = this.$hostInfo.isWindows ? `${pathToEmulatorFromAndroidStudio}.exe` : pathToEmulatorFromAndroidStudio;
			if (this.$fs.exists(realFilePath)) {
				return pathToEmulatorFromAndroidStudio;
			}

			return path.join(this.androidHome, "tools", emulatorExecutableName);
		}

		return emulatorExecutableName;
	}

	public getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string> {
		if (this.mapEmulatorIdToImageIdentifier[emulatorId]) {
			return Promise.resolve(this.mapEmulatorIdToImageIdentifier[emulatorId]);
		}

		const match = emulatorId.match(/^emulator-(\d+)/);
		const portNumber = match && match[1];
		if (!portNumber) {
			return Promise.resolve(null);
		}

		return new Promise<string>(resolveBase => {
			let isResolved = false;
			let output: string = "";

			const resolve = (result: string) => {
				if (!isResolved) {
					isResolved = true;
					resolveBase(result);
				}
			};

			const client = net.connect(portNumber, () => {
				client.write(`avd name${EOL}`);
			});

			const timer = setTimeout(() => {
				this.clearNetConnection(client, timer);
				resolve(null);
			}, 5000);

			client.on('data', data => {
				output += data.toString();

				const imageIdentifier = this.getImageIdentifierFromClientOutput(output);
				// old output should look like:
				// Android Console: type 'help' for a list of commands
				// OK
				// <Name of image>
				// OK
				// new output should look like:
				// Android Console: type 'help' for a list of commands
				// OK
				// a\u001b[K\u001b[Dav\u001b[K\u001b[D\u001b[Davd\u001b...
				// <Name of image>
				// OK
				if (imageIdentifier && !isResolved) {
					this.mapEmulatorIdToImageIdentifier[emulatorId] = imageIdentifier;
					this.clearNetConnection(client, timer);
					resolve(imageIdentifier);
				}
			});

			client.on('error', error => {
				this.$logger.trace(`Error while checking emulator identifier for ${emulatorId}. More info: ${error}.`);
				resolve(null);
			});
		});
	}

	private async getEmulatorImagesCore(): Promise<Mobile.IEmulatorImagesOutput> {
		let result: ISpawnResult = null;
		let devices: Mobile.IDeviceInfo[] = [];

		if (this.pathToAvdManagerExecutable && this.$fs.exists(this.pathToAvdManagerExecutable)) {
			result = await this.$childProcess.trySpawnFromCloseEvent(this.pathToAvdManagerExecutable, ["list", "avds"]);
		} else if (this.pathToAndroidExecutable && this.$fs.exists(this.pathToAndroidExecutable)) {
			result = await this.$childProcess.trySpawnFromCloseEvent(this.pathToAndroidExecutable, ["list", "avd"]);
		}

		if (result && result.stdout) {
			devices = this.parseListAvdsOutput(result.stdout);
		} else {
			devices = this.listAvdsFromDirectory();
		}

		return { devices, errors: result && result.stderr ? [result.stderr] : [] };
	}

	private async getRunningEmulatorData(runningEmulatorId: string, availableEmulators: Mobile.IDeviceInfo[]): Promise<Mobile.IDeviceInfo> {
		const imageIdentifier = await this.getRunningEmulatorImageIdentifier(runningEmulatorId);
		const runningEmulator = this.$emulatorHelper.getEmulatorByImageIdentifier(imageIdentifier, availableEmulators);
		if (!runningEmulator) {
			return null;
		}

		this.$emulatorHelper.setRunningAndroidEmulatorProperties(runningEmulatorId, runningEmulator);

		return runningEmulator;
	}

	@cache()
	private get pathToAvdManagerExecutable(): string {
		let avdManagerPath = null;
		if (this.androidHome) {
			avdManagerPath = path.join(this.androidHome, "tools", "bin", this.getExecutableName("avdmanager"));
		}

		return avdManagerPath;
	}

	@cache()
	private get pathToAndroidExecutable(): string {
		let androidPath = null;
		if (this.androidHome) {
			androidPath = path.join(this.androidHome, "tools", this.getExecutableName("android"));
		}

		return androidPath;
	}

	@cache()
	private get pathToAvdHomeDir(): string {
		const searchPaths = [process.env.ANDROID_AVD_HOME, path.join(osenv.home(), AndroidVirtualDevice.ANDROID_DIR_NAME, AndroidVirtualDevice.AVD_DIR_NAME)];
		return searchPaths.find(p => p && this.$fs.exists(p));
	}

	@cache()
	private getConfigurationError(): string {
		const pathToEmulatorExecutable = this.$hostInfo.isWindows ? `${this.pathToEmulatorExecutable}.exe` : this.pathToAndroidExecutable;
		if (!this.$fs.exists(pathToEmulatorExecutable)) {
			return "Unable to find the path to emulator executable and will not be able to start the emulator. Searched paths: [$ANDROID_HOME/tools/emulator, $ANDROID_HOME/emulator/emulator]";
		}

		return null;
	}

	private getExecutableName(executable: string): string {
		if (this.$hostInfo.isWindows) {
			return `${executable}.bat`;
		}

		return executable;
	}

	private listAvdsFromDirectory(): Mobile.IDeviceInfo[] {
		let devices: Mobile.IDeviceInfo[] = [];

		if (this.pathToAvdHomeDir && this.$fs.exists(this.pathToAvdHomeDir)) {
			const entries = this.$fs.readDirectory(this.pathToAvdHomeDir);
			devices = _.filter(entries, (e: string) => e.match(AndroidVirtualDevice.AVD_FILES_MASK) !== null)
				.map(e => e.match(AndroidVirtualDevice.AVD_FILES_MASK)[1])
				.map(avdName => path.join(this.pathToAvdHomeDir, `${avdName}.avd`))
				.map(avdPath => this.getInfoFromAvd(avdPath))
				.filter(avdInfo => !!avdInfo)
				.map(avdInfo => this.convertAvdToDeviceInfo(avdInfo));
		}

		return devices;
	}

	private parseListAvdsOutput(output: string): Mobile.IDeviceInfo[] {
		let devices: Mobile.IDeviceInfo[] = [];

		const avdOutput = output.split(AndroidVirtualDevice.AVAILABLE_AVDS_MESSAGE);
		const availableDevices = avdOutput && avdOutput[1] && avdOutput[1].trim();
		if (availableDevices) {
			// In some cases `avdmanager list avds` command prints:
			//	`The following Android Virtual Devices could not be loaded:
			//	Name: Pixel_2_XL_API_28
			//	Path: /Users/<username>/.android/avd/Pixel_2_XL_API_28.avd
			//	Error: Google pixel_2_xl no longer exists as a device`
			// These devices sometimes are valid so try to parse them.
			// Also these devices are printed at the end of the output and are separated with 2 new lines from the valid devices output.
			const parts = availableDevices.split(/(?:\r?\n){2}/);
			const items = [parts[0], parts[1]].filter(item => !!item);

			for (const item of items) {
				const result = item
					.split(AndroidVirtualDevice.AVD_LIST_DELIMITER)
					.map(singleDeviceOutput => this.getAvdManagerDeviceInfo(singleDeviceOutput.trim()))
					.map(avdManagerDeviceInfo => this.getInfoFromAvd(avdManagerDeviceInfo.path))
					.filter(avdInfo => !!avdInfo)
					.map(avdInfo => this.convertAvdToDeviceInfo(avdInfo));
				devices = devices.concat(result);
			}
		}

		return devices;
	}

	private getAvdManagerDeviceInfo(output: string): Mobile.IAvdManagerDeviceInfo {
		const avdManagerDeviceInfo: Mobile.IAvdManagerDeviceInfo = Object.create(null);

		// Split by `\n`, not EOL as the avdmanager and android executables print results with `\n` only even on Windows
		_.reduce(output.split("\n"), (result: Mobile.IAvdManagerDeviceInfo, row: string) => {
			const [key, value] = row.split(": ").map(part => part.trim());

			switch (key) {
				case "Name":
				case "Device":
				case "Path":
				case "Target":
				case "Skin":
				case "Sdcard":
					result[key.toLowerCase()] = value;
					break;
			}

			return result;
		}, avdManagerDeviceInfo || {});

		return avdManagerDeviceInfo;
	}

	private getInfoFromAvd(avdFilePath: string): Mobile.IAvdInfo {
		const configIniFilePath = path.join(avdFilePath, AndroidVirtualDevice.CONFIG_INI_FILE_NAME);
		const configIniFileInfo = this.$androidIniFileParser.parseIniFile(configIniFilePath);

		const iniFilePath = this.getIniFilePath(configIniFileInfo, avdFilePath);
		const iniFileInfo = this.$androidIniFileParser.parseIniFile(iniFilePath);
		_.extend(configIniFileInfo, iniFileInfo);

		if (configIniFileInfo && !configIniFileInfo.avdId) {
			configIniFileInfo.avdId = path.basename(avdFilePath).replace(AndroidVirtualDevice.AVD_FILE_EXTENSION, "");
		}

		return configIniFileInfo;
	}

	private convertAvdToDeviceInfo(avdInfo: Mobile.IAvdInfo): Mobile.IDeviceInfo {
		return {
			identifier: null,
			imageIdentifier: avdInfo.avdId || avdInfo.displayName,
			displayName: avdInfo.displayName || avdInfo.avdId || avdInfo.device,
			model: avdInfo.device,
			version: this.$emulatorHelper.mapAndroidApiLevelToVersion[avdInfo.target],
			vendor: AndroidVirtualDevice.AVD_VENDOR_NAME,
			status: NOT_RUNNING_EMULATOR_STATUS,
			errorHelp: this.getConfigurationError(),
			isTablet: false,
			type: DeviceTypes.Emulator,
			platform: this.$devicePlatformsConstants.Android
		};
	}

	private getImageIdentifierFromClientOutput(output: string): string {
		// The lines should be trimmed after the split because the output has \r\n and when using split(EOL) on mac each line ends with \r.
		const lines = _.map(output.split(EOL), line => line.trim());

		const firstIndexOfOk = _.indexOf(lines, "OK");
		if (firstIndexOfOk < 0) {
			return null;
		}

		const secondIndexOfOk = _.indexOf(lines, "OK", firstIndexOfOk + 1);
		if (secondIndexOfOk < 0) {
			return null;
		}

		return lines[secondIndexOfOk - 1].trim();
	}

	private getIniFilePath(configIniFileInfo: Mobile.IAvdInfo, avdFilePath: string): string {
		let result = avdFilePath.replace(AndroidVirtualDevice.AVD_FILE_EXTENSION, AndroidVirtualDevice.INI_FILE_EXTENSION);

		if (configIniFileInfo && configIniFileInfo.avdId) {
			result = path.join(path.dirname(avdFilePath), `${configIniFileInfo.avdId}${AndroidVirtualDevice.INI_FILE_EXTENSION}`);
		}

		return result;
	}

	private clearNetConnection(client: net.Socket, timer: NodeJS.Timer) {
		if (client) {
			client.removeAllListeners();
			client.destroy();
		}

		if (timer) {
			clearTimeout(timer);
		}
	}
}
$injector.register("androidVirtualDeviceService", AndroidVirtualDeviceService);
