declare module "simple-plist" {
	export function readFile(
		filePath: string,
		callback?: (err: Error, obj: any) => void
	): void;
	export function readFileSync(filePath: string): any;
}
