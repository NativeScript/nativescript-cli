/**
 * Declares wrapped functions of temp module
 */
interface ITempService {
	mkdirSync(affixes: string): Promise<string>;
	path(options: ITempPathOptions): Promise<string>;
}
