declare module minimatch {
	export interface Options {
		debug?: boolean;
		nobrace?: boolean;
		noglobstar?: boolean;
		dot?: boolean;
		noext?: boolean;
		nonull?: boolean;
		nocase?: boolean;
		matchBase?: boolean;
		nocomment?: boolean;
		nonegate?: boolean;
		flipNegate?: boolean;
	}

	export interface Minimatch {
		constructor(pattern: string, options: Options): Minimatch;
		pattern: string;
		options: Options;
		regexp: RegExp;
		set: any[][];
		negate: boolean;
		comment: boolean;
		empty: boolean;
		makeRe(): RegExp;
		match(path: string): boolean;
	}

	export interface IMinimatch {
		(path: string, pattern: string, options?: Options): boolean;
		filter(pattern: string, options?: Options): (path: string) => boolean;
		match(fileList: string[], pattern: string, options?: Options): string[];
		makeRe(pattern: string, options?: Options): RegExp;

		Minimatch: minimatch.Minimatch;
	}
}

declare var minimatch: minimatch.IMinimatch;

declare module "minimatch" {
	export = minimatch;
}
