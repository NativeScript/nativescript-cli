declare module "pacote" {
	import * as stream from "stream";

	export function manifest(packageName: string, options: IPacoteManifestOptions): Promise<any>;
	export var tarball: IPacoteTarballResult;

	interface IPacoteTarballResult {
		stream: (packageName: string, options: IPacoteBaseOptions) => IPacoteTarballStreamResult;
		toFile: (packageName: string) => IPacoteTarballFileResult;
	}

	interface IPacoteTarballStreamResult extends stream.Readable { }
	interface IPacoteTarballFileResult { }
}
