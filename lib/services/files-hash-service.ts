import { executeActionByChunks } from "../common/helpers";
import { DEFAULT_CHUNK_SIZE } from "../common/constants";
import { APP_FOLDER_NAME, HASHES_FILE_NAME } from "../constants";
import * as path from "path";

export class FilesHashService implements IFilesHashService {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger) { }

	public async generateHashes(files: string[]): Promise<IStringDictionary> {
		const result: IStringDictionary = {};

		const action = async (file: string) => {
			try {
				const isFile = this.$fs.getFsStats(file).isFile();
				if (isFile) {
					result[file] = await this.$fs.getFileShasum(file);
				}
			} catch (err) {
				this.$logger.trace(`Unable to generate hash for file ${file}. Error is: ${err}`);
			}
		};

		await executeActionByChunks(files, DEFAULT_CHUNK_SIZE, action);

		return result;
	}

	public async generateHashesForProject(platformData: IPlatformData): Promise<IStringDictionary> {
		const appFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
		const files = this.$fs.enumerateFilesInDirectorySync(appFilesPath);
		const hashes = await this.generateHashes(files);
		return hashes;
	}

	public async saveHashesForProject(platformData: IPlatformData, hashesFileDirectory: string): Promise<void> {
		const hashes = await this.generateHashesForProject(platformData);
		const hashesFilePath = path.join(hashesFileDirectory, HASHES_FILE_NAME);
		this.$fs.writeJson(hashesFilePath, hashes);
	}

	public getGeneratedHashes(hashesFileDirectory: string): IStringDictionary {
		let result = {};
		const hashesFilePath = path.join(hashesFileDirectory, HASHES_FILE_NAME);
		if (this.$fs.exists(hashesFilePath)) {
			result = this.$fs.readJson(hashesFilePath);
		}

		return result;
	}

	public async getChanges(files: string[], oldHashes: IStringDictionary): Promise<IStringDictionary> {
		const newHashes = await this.generateHashes(files);
		return this.getChangesInShasums(oldHashes, newHashes);
	}

	public hasChangesInShasums(oldHashes: IStringDictionary, newHashes: IStringDictionary): boolean {
		return !!_.keys(this.getChangesInShasums(oldHashes, newHashes)).length;
	}

	private getChangesInShasums(oldHashes: IStringDictionary, newHashes: IStringDictionary): IStringDictionary {
		return _.omitBy(newHashes, (hash: string, pathToFile: string) => !!_.find(oldHashes, (oldHash: string, oldPath: string) => pathToFile === oldPath && hash === oldHash));
	}
}
$injector.register("filesHashService", FilesHashService);
