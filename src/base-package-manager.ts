import { isInteractive } from "./common/helpers";
import {
	INodePackageManager,
	INodePackageManagerInstallOptions, INpmInstallResultInfo,
	INpmPackageNameParts,
	INpmsResult
} from "./declarations";
import { IChildProcess, IDictionary, IFileSystem, IHostInfo } from "./common/declarations";

export abstract class BasePackageManager implements INodePackageManager {
	public abstract install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo>;
	public abstract uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string>;
	public abstract view(packageName: string, config: Object): Promise<any>;
	public abstract search(filter: string[], config: IDictionary<string | boolean>): Promise<string>;
	public abstract searchNpms(keyword: string): Promise<INpmsResult>;
	public abstract getRegistryPackageData(packageName: string): Promise<any>;
	public abstract getCachePath(): Promise<string>;

	constructor(
		protected $childProcess: IChildProcess,
		protected $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $pacoteService: IPacoteService,
		private packageManager: string
	) { }

	public async isRegistered(packageName: string): Promise<boolean> {
		if (this.isURL(packageName) || this.$fs.exists(packageName) || this.isTgz(packageName)) {
			return false;
		}

		try {
			const viewResult = await this.view(packageName, { name: true });

			// `npm view nonExistingPackageName` will return `nativescript`
			// if executed in the root dir of the CLI (npm 6.4.1)
			const packageNameRegex = new RegExp(packageName, "i");
			const isProperResult = packageNameRegex.test(viewResult);

			return isProperResult;
		} catch (e) {
			return false;
		}
	}

	public async getPackageNameParts(fullPackageName: string): Promise<INpmPackageNameParts> {
		// support <reserved_name>@<version> syntax, for example typescript@1.0.0
		// support <scoped_package_name>@<version> syntax, for example @nativescript/vue-template@1.0.0
		const lastIndexOfAtSign = fullPackageName.lastIndexOf("@");
		let version = "";
		let templateName = "";
		if (lastIndexOfAtSign > 0) {
			templateName = fullPackageName.substr(0, lastIndexOfAtSign).toLowerCase();
			version = fullPackageName.substr(lastIndexOfAtSign + 1);
		}

		return {
			name: templateName || fullPackageName,
			version: version
		};
	}

	public async getPackageFullName(packageNameParts: INpmPackageNameParts): Promise<string> {
		return packageNameParts.version ? `${packageNameParts.name}@${packageNameParts.version}` : packageNameParts.name;
	}

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
				if (flag === "dist-tags" || flag === "versions" || flag === "name" || flag === "gradle") {
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

	private isTgz(packageName: string): boolean {
		return packageName.indexOf(".tgz") >= 0;
	}

	private isURL(str: string): boolean {
		const urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		const url = new RegExp(urlRegex, 'i');
		return str.length < 2083 && url.test(str);
	}
}
