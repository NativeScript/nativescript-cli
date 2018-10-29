import { isInteractive } from "./common/helpers";

export class BasePackageManager {
	constructor(
		protected $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $pacoteService: IPacoteService,
		private packageManager: string
	) { }

	protected getPackageManagerExecutableName(): string {
		let npmExecutableName = this.packageManager;

		if (this.$hostInfo.isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	protected async processPackageManagerInstall(packageName: string, params: string[], opts: { cwd: string, isInstallingAllDependencies: boolean }): Promise<INpmInstallResultInfo> {
		const npmExecutable = this.getPackageManagerExecutableName();
		const stdioValue = isInteractive() ? "inherit" : "pipe";
		await this.$childProcess.spawnFromEvent(npmExecutable, params, "close", { cwd: opts.cwd, stdio: stdioValue });

		// Whenever calling "npm install" or "yarn add" without any arguments (hence installing all dependencies) no output is emitted on stdout
		// Luckily, whenever you call "npm install" or "yarn add" to install all dependencies chances are you won't need the name/version of the package you're installing because there is none.
		const { isInstallingAllDependencies } = opts;
		if (isInstallingAllDependencies) {
			return null;
		}

		const packageMetadata = await this.$pacoteService.manifest(packageName);
		return {
			name: packageMetadata.name,
			version: packageMetadata.version
		};
	}

	protected getFlagsString(config: any, asArray: boolean): any {
		const array: Array<string> = [];
		for (const flag in config) {
			if (flag === "global" && this.packageManager !== 'yarn') {
				array.push(`--${flag}`);
				array.push(`${config[flag]}`);
			} else if (config[flag]) {
				if (flag === "dist-tags" || flag === "versions") {
					array.push(` ${flag}`);
					continue;
				}
				array.push(`--${flag}`);
			}
		}
		if (asArray) {
			return array;
		}

		return array.join(" ");
	}
}
