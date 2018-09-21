declare module "rimraf" {
	function rimraf(path: string, callback: (error: Error) => void): void;
	namespace rimraf {
		export function sync(path: string): void;
		export var EMFILE_MAX: number;
		export var BUSYTRIES_MAX: number;
	}
	export = rimraf;
}
