import * as pacote from "pacote";
import * as tar from "tar";
import * as path from "path";

export class PacoteService implements IPacoteService {
	constructor(private $fs: IFileSystem,
		private $npm: INodePackageManager) { }

	public async manifest(packageName: string, options?: IPacoteManifestOptions): Promise<any> {
		// In case `tns create myapp --template https://github.com/NativeScript/template-hello-world.git` command is executed, pacote module throws an error if cache option is not provided.
		const cache = await this.$npm.getCachePath();
		const manifestOptions = { cache };
		if (options) {
			_.extend(manifestOptions, options);
		}

		if (this.$fs.exists(packageName)) {
			packageName = path.resolve(packageName);
		}

		return pacote.manifest(packageName, manifestOptions);
	}

	public async extractPackage(packageName: string, destinationDirectory: string, options?: IPacoteExtractOptions): Promise<void> {
		// strip: Remove the specified number of leading path elements. Pathnames with fewer elements will be silently skipped. More info: https://github.com/npm/node-tar/blob/e89c4d37519b1c20133a9f49d5f6b85fa34c203b/README.md
		// C: Create an archive
		const extractOptions = { strip: 1, C: destinationDirectory };
		if (options) {
			_.extend(extractOptions, options);
		}

		const cache = await this.$npm.getCachePath();
		return new Promise<void>((resolve, reject) => {
			const source = pacote.tarball.stream(packageName, { cache });
			source.on("error", (err: Error) => {
				reject(err);
			});

			const destination = tar.x(extractOptions);
			source.pipe(destination);

			destination.on("error", (err: Error) => reject(err));
			destination.on("finish", () => resolve());
		});
	}
}
$injector.register("pacoteService", PacoteService);
