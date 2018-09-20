import * as path from "path";
import * as semver from "semver";
import * as temp from "temp";
import { AndroidDeviceHashService } from "./android-device-hash-service";
import { executeActionByChunks } from "../../helpers";
import { DEFAULT_CHUNK_SIZE } from '../../constants';

export class AndroidDeviceFileSystem implements Mobile.IDeviceFileSystem {
	private _deviceHashServices = Object.create(null);

	constructor(private adb: Mobile.IDeviceAndroidDebugBridge,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector) { }

	public async listFiles(devicePath: string, appIdentifier?: string): Promise<any> {
		let listCommandArgs = ["ls", "-a", devicePath];
		if (appIdentifier) {
			listCommandArgs = ["run-as", appIdentifier].concat(listCommandArgs);
		}

		return this.adb.executeShellCommand(listCommandArgs);
	}

	public async getFile(deviceFilePath: string, appIdentifier: string, outputPath?: string): Promise<void> {
		const stdout = !outputPath;

		if (stdout) {
			temp.track();
			outputPath = temp.path({ prefix: "sync", suffix: ".tmp" });
		}

		await this.adb.executeCommand(["pull", deviceFilePath, outputPath]);

		if (stdout) {
			await new Promise<void>((resolve, reject) => {
				const readStream = this.$fs.createReadStream(outputPath);
				readStream.pipe(process.stdout);
				readStream.on("end", () => {
					resolve();
				});

				readStream.on("error", (err: Error) => {
					reject(err);
				});
			});
		}
	}

	public async putFile(localFilePath: string, deviceFilePath: string, appIdentifier: string): Promise<void> {
		await this.adb.pushFile(localFilePath, deviceFilePath);
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<Mobile.ILocalToDevicePathData[]> {
		const directoriesToChmod: string[] = [];
		const transferredFiles: Mobile.ILocalToDevicePathData[] = [];
		const action = async (localToDevicePathData: Mobile.ILocalToDevicePathData) => {
			const fstat = this.$fs.getFsStats(localToDevicePathData.getLocalPath());
			if (fstat.isFile()) {
				const devicePath = localToDevicePathData.getDevicePath();
				await this.adb.pushFile(localToDevicePathData.getLocalPath(), devicePath);
				transferredFiles.push(localToDevicePathData);
			} else if (fstat.isDirectory()) {
				const dirToChmod = localToDevicePathData.getDevicePath();
				directoriesToChmod.push(dirToChmod);
			}
		};

		await executeActionByChunks<Mobile.ILocalToDevicePathData>(localToDevicePaths, DEFAULT_CHUNK_SIZE, action);

		const dirsChmodAction = (directoryToChmod: string) => this.adb.executeShellCommand(["chmod", "0777", directoryToChmod]);

		await executeActionByChunks<string>(_.uniq(directoriesToChmod), DEFAULT_CHUNK_SIZE, dirsChmodAction);

		return transferredFiles;
	}

	public async transferDirectory(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<Mobile.ILocalToDevicePathData[]> {
		// starting from Android 9, adb push is throwing an exception when there are subfolders
		// the check could be removed when we start supporting only runtime versions with sockets
		const minAndroidWithoutAdbPushDir = "9.0.0";
		const isAdbPushDirSupported = semver.lt(semver.coerce(deviceAppData.device.deviceInfo.version), minAndroidWithoutAdbPushDir);
		const deviceProjectDir = await deviceAppData.getDeviceProjectRootPath();
		let transferredLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];

		if (isAdbPushDirSupported) {
			await this.adb.pushFile(projectFilesPath, deviceProjectDir);
			transferredLocalToDevicePaths = localToDevicePaths;
		} else {
			transferredLocalToDevicePaths = await this.pushFiles(localToDevicePaths);
		}

		if (transferredLocalToDevicePaths.length) {
			const filesToChmodOnDevice = transferredLocalToDevicePaths.map(localToDevicePath => localToDevicePath.getDevicePath());
			await this.chmodFiles(deviceProjectDir, filesToChmodOnDevice);
		}

		return transferredLocalToDevicePaths;
	}

	private async chmodFiles(deviceProjectRoot: string, filesToChmodOnDevice: string[]) {
		const commandsDeviceFilePath = this.$mobileHelper.buildDevicePath(deviceProjectRoot, "nativescript.commands.sh");
		await this.createFileOnDevice(commandsDeviceFilePath, `chmod 0777 ${filesToChmodOnDevice.join(" ")}`);
		await this.adb.executeShellCommand([commandsDeviceFilePath]);
	}

	private async pushFiles(localToDevicePaths: Mobile.ILocalToDevicePathData[]) {
		this.$logger.trace("Changed hashes are:", localToDevicePaths);
		const transferredFiles: Mobile.ILocalToDevicePathData[] = [];
		const transferFileAction = async (localToDevicePathData: Mobile.ILocalToDevicePathData) => {
			transferredFiles.push(localToDevicePathData);
			await this.transferFile(localToDevicePathData.getLocalPath(), localToDevicePathData.getDevicePath());
		};

		await executeActionByChunks<Mobile.ILocalToDevicePathData>(localToDevicePaths, DEFAULT_CHUNK_SIZE, transferFileAction);

		return transferredFiles;
	}

	public async transferFile(localPath: string, devicePath: string): Promise<void> {
		this.$logger.trace(`Transfering ${localPath} to ${devicePath}`);
		const stats = this.$fs.getFsStats(localPath);
		if (stats.isDirectory()) {
			await this.adb.executeShellCommand(["mkdir", path.dirname(devicePath)]);
		} else {
			await this.adb.pushFile(localPath, devicePath);
		}
	}

	public async createFileOnDevice(deviceFilePath: string, fileContent: string): Promise<void> {
		const hostTmpDir = this.getTempDir();
		const commandsFileHostPath = path.join(hostTmpDir, "temp.commands.file");
		this.$fs.writeFile(commandsFileHostPath, fileContent);

		// copy it to the device
		await this.transferFile(commandsFileHostPath, deviceFilePath);
		await this.adb.executeShellCommand(["chmod", "0777", deviceFilePath]);
	}

	public async deleteFile(deviceFilePath: string, appIdentifier: string): Promise<void> {
		await this.adb.executeShellCommand(["rm", "-rf", deviceFilePath]);
	}

	public async updateHashesOnDevice(hashes: IStringDictionary, appIdentifier: string): Promise<void> {
		const deviceHashService = this.getDeviceHashService(appIdentifier);
		await deviceHashService.uploadHashFileToDevice(hashes);
	}

	private getTempDir(): string {
		temp.track();
		return temp.mkdirSync("application-");
	}

	private getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		if (!this._deviceHashServices[appIdentifier]) {
			this._deviceHashServices[appIdentifier] = this.$injector.resolve(AndroidDeviceHashService, { adb: this.adb, appIdentifier });
		}

		return this._deviceHashServices[appIdentifier];
	}
}
