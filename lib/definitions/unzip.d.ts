declare module "unzip" {
	export function Extract(options: { path: string }): NodeJS.WritableStream;
}
