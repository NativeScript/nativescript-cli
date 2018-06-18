interface IFilesHashService {
	generateHashes(files: string[]): Promise<IStringDictionary>;
	/**
	 * Generate hashes for all prepared files (all files from app folder under platforms folder).
	 * @param platformData - Current platform's data
	 * @returns {Promise<IStringDictionary>}
	 * A map with key file's path and value - file's hash
	 */
	generateHashesForProject(platformData: IPlatformData): Promise<IStringDictionary>;
	/**
	 * @param hashesFileDirectory - Path to directory containing the hash file.
	 * @returns {IStringDictionary}
	 * In case .nshashes file exists (under `hashesFileDirectory` directory), returns its content
	 * In case .nshashes file does not exist (under `hashesFileDirectory` directory), returns {}
	 */
	getGeneratedHashes(hashesFileDirectory: string): IStringDictionary;
	/**
	 * Generates hashes for all prepared files (all files from app folder under platforms folder)
	 * and saves them in .nshashes file under `hashFileDirectory` directory.
	 * @param platformData - Current platform's data
	 * @param hashesFileDirectory - Path to directory containing the hash file.
	 * @returns {Promise<void>}
	 */
	saveHashesForProject(platformData: IPlatformData, hashesFileDirectory: string): Promise<void>;
	getChanges(files: string[], oldHashes: IStringDictionary): Promise<IStringDictionary>;
	hasChangesInShasums(oldHashes: IStringDictionary, newHashes: IStringDictionary): boolean;
}
