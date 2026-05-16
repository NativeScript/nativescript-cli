import * as fs from "fs";
import * as path from "path";
import { IStringDictionary } from "../../declarations";

export class WindowsDeviceFileSystem implements Mobile.IDeviceFileSystem {
	public async listFiles(_devicePath: string): Promise<void> {
		// no-op for local desktop
	}

	public async getFile(
		deviceFilePath: string,
		_appIdentifier: string,
		outputFilePath?: string,
	): Promise<void> {
		if (outputFilePath) {
			fs.copyFileSync(deviceFilePath, outputFilePath);
		}
	}

	public async getFileContent(
		deviceFilePath: string,
		_appIdentifier: string,
	): Promise<string> {
		return fs.existsSync(deviceFilePath)
			? fs.readFileSync(deviceFilePath, "utf8")
			: null;
	}

	public async putFile(
		localFilePath: string,
		deviceFilePath: string,
		_appIdentifier: string,
	): Promise<void> {
		fs.mkdirSync(path.dirname(deviceFilePath), { recursive: true });
		fs.copyFileSync(localFilePath, deviceFilePath);
	}

	public async deleteFile(
		deviceFilePath: string,
		_appIdentifier: string,
	): Promise<void> {
		if (fs.existsSync(deviceFilePath)) {
			fs.unlinkSync(deviceFilePath);
		}
	}

	public async transferFiles(
		_deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
	): Promise<Mobile.ILocalToDevicePathData[]> {
		this._syncPaths(localToDevicePaths);
		return localToDevicePaths;
	}

	public async transferDirectory(
		_deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		_projectFilesPath: string,
	): Promise<Mobile.ILocalToDevicePathData[]> {
		this._syncPaths(localToDevicePaths);
		return localToDevicePaths;
	}

	private _syncPaths(localToDevicePaths: Mobile.ILocalToDevicePathData[]): void {
		for (const pathData of localToDevicePaths) {
			const src = pathData.getLocalPath();
			const dest = pathData.getDevicePath();
			if (src === dest) {
				continue;
			}
			try {
				const stat = fs.statSync(src);
				if (stat.isDirectory()) {
					fs.mkdirSync(dest, { recursive: true });
				} else {
					fs.mkdirSync(path.dirname(dest), { recursive: true });
					fs.copyFileSync(src, dest);
				}
			} catch {
				// skip entries that disappeared between detection and sync
			}
		}
	}

	public async transferFile(
		localFilePath: string,
		deviceFilePath: string,
	): Promise<void> {
		fs.mkdirSync(path.dirname(deviceFilePath), { recursive: true });
		fs.copyFileSync(localFilePath, deviceFilePath);
	}

	public async createFileOnDevice(
		deviceFilePath: string,
		fileContent: string,
	): Promise<void> {
		fs.mkdirSync(path.dirname(deviceFilePath), { recursive: true });
		fs.writeFileSync(deviceFilePath, fileContent, "utf8");
	}

	public async updateHashesOnDevice(
		_hashes: IStringDictionary,
		_appIdentifier: string,
	): Promise<void> {
		// no-op — Windows LiveSync does not use hash-based diffing yet
	}

	public getDeviceHashService(_appIdentifier: string): any {
		return {
			generateHashesFromLocalToDevicePaths: async (_paths: any[]) => ({}),
			removeHashes: async (_paths: any[]) => {},
		};
	}
}
