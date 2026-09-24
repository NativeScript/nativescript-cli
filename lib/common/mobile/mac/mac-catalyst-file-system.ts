import * as path from "path";
import * as shelljs from "shelljs";
import * as _ from "lodash";
import { IFileSystem, IStringDictionary } from "../../declarations";

/**
 * Local file operations on the Mac Catalyst app bundle, which is a plain directory.
 */
export class MacCatalystFileSystem implements Mobile.IDeviceFileSystem {
	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
	) {}

	public async listFiles(devicePath: string): Promise<string[]> {
		return this.$fs.readDirectory(devicePath);
	}

	public async getFile(
		deviceFilePath: string,
		appIdentifier: string,
		outputFilePath?: string,
	): Promise<void> {
		if (outputFilePath) {
			shelljs.cp("-f", deviceFilePath, outputFilePath);
		}
	}

	public async getFileContent(
		deviceFilePath: string,
		appIdentifier: string,
	): Promise<string> {
		return this.$fs.readText(deviceFilePath);
	}

	public async putFile(
		localFilePath: string,
		deviceFilePath: string,
		appIdentifier: string,
	): Promise<void> {
		shelljs.cp("-f", localFilePath, deviceFilePath);
	}

	public async deleteFile(
		deviceFilePath: string,
		appIdentifier: string,
	): Promise<void> {
		shelljs.rm("-rf", deviceFilePath);
	}

	public async transferFiles(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
	): Promise<Mobile.ILocalToDevicePathData[]> {
		await Promise.all(
			_.map(localToDevicePaths, (localToDevicePathData) =>
				this.transferFile(
					localToDevicePathData.getLocalPath(),
					localToDevicePathData.getDevicePath(),
				),
			),
		);
		return localToDevicePaths;
	}

	public async transferDirectory(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string,
	): Promise<Mobile.ILocalToDevicePathData[]> {
		const destinationPath = await deviceAppData.getDeviceProjectRootPath();
		this.$logger.trace(
			`Transferring from ${projectFilesPath} to ${destinationPath}`,
		);
		this.$fs.ensureDirectoryExists(destinationPath);
		shelljs.cp("-Rf", path.join(projectFilesPath, "*"), destinationPath);
		return localToDevicePaths;
	}

	public async transferFile(
		localFilePath: string,
		deviceFilePath: string,
	): Promise<void> {
		this.$logger.trace(
			`Transferring from ${localFilePath} to ${deviceFilePath}`,
		);
		if (this.$fs.getFsStats(localFilePath).isDirectory()) {
			this.$fs.ensureDirectoryExists(deviceFilePath);
		} else {
			this.$fs.ensureDirectoryExists(path.dirname(deviceFilePath));
			shelljs.cp("-f", localFilePath, deviceFilePath);
		}
	}

	public updateHashesOnDevice(
		hashes: IStringDictionary,
		appIdentifier: string,
	): Promise<void> {
		return;
	}
}
