 declare module "npm" {
	var cache: string;
	var commands: any[];
	function load(config: Object, callback: (err: any, data: any) => void);
}