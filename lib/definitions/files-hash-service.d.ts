import { IPlatformData } from "./platform";
import { IStringDictionary } from "../common/declarations";

interface IFilesHashService {
	generateHashes(files: string[]): Promise<IStringDictionary>;
	/**
	 * Generate hashes for all prepared files (all files from app folder under platforms folder).
	 * @param platformData - Current platform's data
	 * @returns {Promise<IStringDictionary>}
	 * A map with key file's path and value - file's hash
	 */
	generateHashesForProject(
		platformData: IPlatformData,
	): Promise<IStringDictionary>;
	/**
	 * Generates hashes for all prepared files (all files from app folder under platforms folder)
	 * and saves them in .nshashes file under `hashFileDirectory` directory.
	 * @param platformData - Current platform's data
	 * @param hashesFileDirectory - Path to directory containing the hash file.
	 * @returns {Promise<void>}
	 */
	saveHashesForProject(
		platformData: IPlatformData,
		hashesFileDirectory: string,
	): Promise<IStringDictionary>;
	saveHashes(hashes: IStringDictionary, hashesFileDirectory: string): void;
	getChanges(
		files: string[],
		oldHashes: IStringDictionary,
	): Promise<IStringDictionary>;
	hasChangesInShasums(
		oldHashes: IStringDictionary,
		newHashes: IStringDictionary,
	): boolean;
}

/**
 * sha1 hashes of plugins' native files computed earlier in the same prepare,
 * so a later step does not read the same files again. Cleared when a prepare
 * starts; each hash is served once.
 */
interface INativeFileHashesMemo {
	clear(): void;
	remember(filePath: string, sha1: string): void;
	take(filePath: string): string | undefined;
}
