interface ITempPathOptions {
	prefix?: string;
	suffix?: string;
}

interface ITempFileInfo {
	path?: string;
	fd?: any;
}

declare module "temp" {
	function track(): void;
	function cleanup(): void;
	function mkdirSync(affixes: string): string;
	function path(options: ITempPathOptions): string;
	function open(
		name: string,
		fn: (error: Error, info: ITempFileInfo) => void
	): any;
}
