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

	public async downloadAndExtract(packageName: string, destinationDirectory: string, options?: IPacoteExtractOptions): Promise<void> {
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
