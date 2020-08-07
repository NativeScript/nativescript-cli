declare module "npm" {
	let cache: any;
	let commands: { [index: string]: any };
	let prefix: string;
	function load(config: Object, callback: (err: any, data: any) => void): void;
	module config {
		let loaded: boolean;
		module sources {
			let cli: { data: Object };
		}
	}
}
