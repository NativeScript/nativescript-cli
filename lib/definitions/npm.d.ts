 declare module "npm" {
	var cache: any;
	var commands: { [index: string]: any };
	function load(config: Object, callback: (err: any, data: any) => void): void;
}