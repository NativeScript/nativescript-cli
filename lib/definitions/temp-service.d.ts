import { AffixOptions } from "temp";

/**
 * Declares wrapped functions of temp module
 */
interface ITempService {
	mkdirSync(affixes: string | AffixOptions): Promise<string>;
	path(options: string | AffixOptions): Promise<string>;
}
