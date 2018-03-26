import { executeActionByChunks } from "../common/helpers";
import { DEFAULT_CHUNK_SIZE } from "../common/constants";

export class FilesHashService implements IFilesHashService {
	constructor(private $fs: IFileSystem) { }

	public async generateHashes(files: string[]): Promise<IStringDictionary> {
		const result: IStringDictionary = {};

		const action = async (file: string) => {
			if (this.$fs.getFsStats(file).isFile()) {
				result[file] = await this.$fs.getFileShasum(file);
			}
		};

		await executeActionByChunks(files, DEFAULT_CHUNK_SIZE, action);

		return result;
	}

	public async getChanges(files: string[], oldHashes: IStringDictionary): Promise<IStringDictionary> {
		const newHashes = await this.generateHashes(files);
		return _.omitBy(newHashes, (hash: string, pathToFile: string) => !!_.find(oldHashes, (oldHash: string, oldPath: string) => pathToFile === oldPath && hash === oldHash));
	}
}
$injector.register("filesHashService", FilesHashService);
