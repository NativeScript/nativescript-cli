import * as path from "path";
import { cache } from "../../decorators";
import { executeActionByChunks } from "../../helpers";
import { DEFAULT_CHUNK_SIZE, LiveSyncPaths } from "../../constants";

export class AndroidDeviceHashService implements Mobile.IAndroidDeviceHashService {
	private static HASH_FILE_NAME = "hashes";

	constructor(private adb: Mobile.IDeviceAndroidDebugBridge,
		private appIdentifier: string,
		private $fs: IFileSystem,
		private $mobileHelper: Mobile.IMobileHelper,
		private $tempService: ITempService) {
	}

	@cache()
	public get hashFileDevicePath(): string {
		return this.$mobileHelper.buildDevicePath(LiveSyncPaths.ANDROID_TMP_DIR_NAME, this.appIdentifier, AndroidDeviceHashService.HASH_FILE_NAME);
	}

	public async doesShasumFileExistsOnDevice(): Promise<boolean> {
		const lsResult = await this.adb.executeShellCommand(["ls", this.hashFileDevicePath]);
		return !!(lsResult && lsResult.trim() === this.hashFileDevicePath);
	}

	public async getShasumsFromDevice(): Promise<IStringDictionary> {
		const hashFileLocalPath = await this.downloadHashFileFromDevice();

		if (this.$fs.exists(hashFileLocalPath)) {
			return this.$fs.readJson(hashFileLocalPath);
		}

		return null;
	}

	public async uploadHashFileToDevice(data: IStringDictionary): Promise<void> {
		const hashFileLocalPath = await this.getHashFileLocalPath();
		this.$fs.writeJson(hashFileLocalPath, data);
		await this.adb.pushFile(hashFileLocalPath, this.hashFileDevicePath);
	}

	public async updateHashes(localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		const oldShasums = await this.getShasumsFromDevice() || {};
		await this.generateHashesFromLocalToDevicePaths(localToDevicePaths, oldShasums);

		await this.uploadHashFileToDevice(oldShasums);
	}

	public async generateHashesFromLocalToDevicePaths(localToDevicePaths: Mobile.ILocalToDevicePathData[], initialShasums: IStringDictionary = {}): Promise<IStringDictionary> {
		const action = async (localToDevicePathData: Mobile.ILocalToDevicePathData) => {
			const localPath = localToDevicePathData.getLocalPath();
			if (this.$fs.getFsStats(localPath).isFile()) {
				// TODO: Use relative to project path for key
				// This will speed up livesync on the same device for the same project on different PCs.
				initialShasums[localPath] = await this.$fs.getFileShasum(localPath);
			}
		};

		await executeActionByChunks<Mobile.ILocalToDevicePathData>(localToDevicePaths, DEFAULT_CHUNK_SIZE, action);

		return initialShasums;
	}

	public getDevicePaths(localToDevicePaths: Mobile.ILocalToDevicePathData[]): string[] {
		return _.map(localToDevicePaths, (localToDevicePathData => {
			return `"${localToDevicePathData.getDevicePath()}"`;
		}));
	}

	public getChangedShasums(oldShasums: IStringDictionary, currentShasums: IStringDictionary): IStringDictionary {
		if (!oldShasums) {
			return currentShasums;
		}

		return _.omitBy(currentShasums, (hash: string, pathToFile: string) => !!oldShasums[pathToFile] && oldShasums[pathToFile] === hash);
	}

	public async removeHashes(localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<boolean> {
		const oldShasums = await this.getShasumsFromDevice();
		if (oldShasums) {
			const fileToShasumDictionary = <IStringDictionary>(_.omit(oldShasums, localToDevicePaths.map(ldp => ldp.getLocalPath())));
			await this.uploadHashFileToDevice(fileToShasumDictionary);
			return true;
		}

		return false;
	}

	@cache()
	private async getHashFileLocalPath(): Promise<string> {
		return path.join(await this.getTempDir(), AndroidDeviceHashService.HASH_FILE_NAME);
	}

	@cache()
	private getTempDir(): Promise<string> {
		return this.$tempService.mkdirSync(`android-device-hash-service-${this.appIdentifier}`);
	}

	private async downloadHashFileFromDevice(): Promise<string> {
		const hashFileLocalPath = await this.getHashFileLocalPath();
		if (!this.$fs.exists(hashFileLocalPath)) {
			await this.adb.executeCommand(["pull", this.hashFileDevicePath, await this.getTempDir()]);
		}
		return hashFileLocalPath;
	}
}
