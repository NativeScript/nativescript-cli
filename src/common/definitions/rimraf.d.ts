declare module "rimraf" {
	function rimraf(path: string, callback: (error: Error) => void): void;

	namespace rimraf {
		export function sync(path: string): void;

		export let EMFILE_MAX: number;
		export let BUSYTRIES_MAX: number;
	}
	export = rimraf;
}
