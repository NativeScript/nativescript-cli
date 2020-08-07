declare module "plist" {
	export function parse(data: any): any;
	export function build(data: any): string;
}
