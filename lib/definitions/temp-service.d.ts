export type AffixOptions = {
	prefix?: string;
	suffix?: string;
	dir?: string;
};

/**
 * Declares wrapped functions of temp module
 */
export interface ITempService {
	mkdirSync(affixes: string | AffixOptions): Promise<string>;
	path(options: string | AffixOptions): Promise<string>;
}
