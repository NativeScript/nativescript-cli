import { isInteractive } from "./common/helpers";

export class BasePackageManager {
	constructor(
		protected $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private packageManager: string
	) { }

	protected getPackageManagerExecutableName(): string {
		let npmExecutableName = this.packageManager;

		if (this.$hostInfo.isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	protected async processPackageManagerInstall(params: string[], opts: { cwd: string }) {
		const npmExecutable = this.getPackageManagerExecutableName();
		const stdioValue = isInteractive() ? "inherit" : "pipe";
		return await this.$childProcess.spawnFromEvent(npmExecutable, params, "close", { cwd: opts.cwd, stdio: stdioValue });
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
