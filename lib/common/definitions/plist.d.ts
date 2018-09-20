declare module "plist" {
	export function parse(data: any): IDictionary<any>;
	export function build(data: any): string;
}
