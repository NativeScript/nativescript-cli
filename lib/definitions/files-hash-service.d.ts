interface IFilesHashService {
	generateHashes(files: string[]): Promise<IStringDictionary>;
	getChanges(files: string[], oldHashes: IStringDictionary): Promise<IStringDictionary>;
	hasChangesInShasums(oldHashes: IStringDictionary, newHashes: IStringDictionary): boolean;
}
