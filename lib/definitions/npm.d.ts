 declare module "npm" {
	var cache: string;
	var commands: { [index: string]: any };
	function load(config: Object, callback: (err: any, data: any) => void): void;
}