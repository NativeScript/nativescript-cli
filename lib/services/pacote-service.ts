import * as pacote from "pacote";
import * as tar from "tar";

export class PacoteService implements IPacoteService {
	constructor(private $npm: INodePackageManager) { }

	public async manifest(packageName: string, options?: IPacoteManifestOptions): Promise<any> {
		// In case `tns create myapp --template https://github.com/NativeScript/template-hello-world.git` command is executed, pacote module throws an error if cache option is not provided.
		const manifestOptions = { cache: await this.$npm.getCachePath() };
		if (options) {
			_.extend(manifestOptions, options);
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

		const source = pacote.tarball.stream(packageName, { cache: await this.$npm.getCachePath() });
		const destination = tar.x(extractOptions);
		source.pipe(destination);

		return new Promise<void>((resolve, reject) => {
			destination.on("error", (err: Error) => reject(err));
			destination.on("finish", () => resolve());
		});
	}
}
$injector.register("pacoteService", PacoteService);
