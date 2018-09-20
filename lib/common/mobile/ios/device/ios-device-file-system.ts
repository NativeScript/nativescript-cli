import { EOL } from "os";

export class IOSDeviceFileSystem implements Mobile.IDeviceFileSystem {
	private static AFC_DELETE_FILE_NOT_FOUND_ERROR = 8;

	constructor(private device: Mobile.IDevice,
		private $logger: ILogger,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $fs: IFileSystem) { }

	public async listFiles(devicePath: string, appIdentifier: string): Promise<void> {
		if (!devicePath) {
			devicePath = ".";
		}

		this.$logger.info("Listing %s", devicePath);

		const deviceIdentifier = this.device.deviceInfo.identifier;
		let children: string[] = [];
		const result = await this.$iosDeviceOperations.listDirectory([{ deviceId: deviceIdentifier, path: devicePath, appId: appIdentifier }]);
		children = result[deviceIdentifier][0].response;
		this.$logger.out(children.join(EOL));
	}

	public async getFile(deviceFilePath: string, appIdentifier: string, outputFilePath?: string): Promise<void> {
		if (!outputFilePath) {
			const result = await this.$iosDeviceOperations.readFiles([{ deviceId: this.device.deviceInfo.identifier, path: deviceFilePath, appId: appIdentifier }]);
			const response = result[this.device.deviceInfo.identifier][0];
			if (response) {
				this.$logger.out(response.response);
			}
		} else {
			await this.$iosDeviceOperations.downloadFiles([{ appId: appIdentifier, deviceId: this.device.deviceInfo.identifier, source: deviceFilePath, destination: outputFilePath }]);
		}
	}

	public async putFile(localFilePath: string, deviceFilePath: string, appIdentifier: string): Promise<void> {
		await this.uploadFilesCore([{ appId: appIdentifier, deviceId: this.device.deviceInfo.identifier, files: [{ source: localFilePath, destination: deviceFilePath }] }]);
	}

	public async deleteFile(deviceFilePath: string, appIdentifier: string): Promise<void> {
		await this.$iosDeviceOperations.deleteFiles([{ appId: appIdentifier, destination: deviceFilePath, deviceId: this.device.deviceInfo.identifier }], (err: IOSDeviceLib.IDeviceError) => {
			this.$logger.trace(`Error while deleting file: ${deviceFilePath}: ${err.message} with code: ${err.code}`);

			if (err.code !== IOSDeviceFileSystem.AFC_DELETE_FILE_NOT_FOUND_ERROR) {
				this.$logger.warn(`Cannot delete file: ${deviceFilePath}. Reason: ${err.message}`);
			}
		});
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<Mobile.ILocalToDevicePathData[]> {
		const filesToUpload: Mobile.ILocalToDevicePathData[] = _.filter(localToDevicePaths, l => this.$fs.getFsStats(l.getLocalPath()).isFile());
		const files: IOSDeviceLib.IFileData[] = filesToUpload.map(l => ({ source: l.getLocalPath(), destination: l.getDevicePath() }));

		await this.uploadFilesCore([{
			deviceId: this.device.deviceInfo.identifier,
			appId: deviceAppData.appIdentifier,
			files: files
		}]);

		return filesToUpload;
	}

	public async transferDirectory(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<Mobile.ILocalToDevicePathData[]> {
		await this.transferFiles(deviceAppData, localToDevicePaths);
		return localToDevicePaths;
	}

	public async updateHashesOnDevice(hashes: IStringDictionary, appIdentifier: string): Promise<void> { return; }

	private async uploadFilesCore(filesToUpload: IOSDeviceLib.IUploadFilesData[]): Promise<void> {
		await this.$iosDeviceOperations.uploadFiles(filesToUpload, (err: IOSDeviceLib.IDeviceError) => {
			if (err.deviceId === this.device.deviceInfo.identifier) {
				throw err;
			}
		});
	}
}
