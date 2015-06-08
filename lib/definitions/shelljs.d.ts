declare module "shelljs" {
	function cp(arg: string, sourcePath: string, destinationPath: string): void;
	function cp(arg: string, sourcePath: string[], destinationPath: string): void;
	function sed(arg: string, oldValue: any, newValue: string, filePath: string): void;
	function mv(source: string[], destination: string): void;
	function rm(option: string, filePath: string): void;
	function grep(what: any, where: string): any;
}