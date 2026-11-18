import * as path from "path";
import * as _ from "lodash";
import { BasePackageManager } from "./base-package-manager";
import { exported } from "../common/decorators";
import {
	IPackageInstallOptions,
	IPackageUninstallOptions,
	INpmInstallResultInfo,
	INpmsResult,
} from "../declarations";
import {
	IChildProcess,
	IErrors,
	IFileSystem,
	IHostInfo,
	Server,
} from "../common/declarations";
import { injector } from "../common/yok";

export class Yarn2PackageManager extends BasePackageManager {
	protected readonly installFlags = {
		dev: "--dev",
		optional: "--optional",
		exact: "--exact",
		silent: "--silent",
		// yarn berry has no --ignore-scripts; skip-build is the mode that
		// installs without running any build scripts.
		ignoreScripts: "--mode=skip-build",
	};
	protected readonly uninstallFlags = {};

	private $hostInfo_: IHostInfo;
	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		$pacoteService: IPacoteService
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, "yarn2");
		this.$hostInfo_ = $hostInfo;
	}

	protected getPackageManagerExecutableName(): string {
		let executableName = "yarn";

		if (this.$hostInfo_.isWindows) {
			executableName += ".cmd";
		}

		return executableName;
	}

	@exported("yarn2")
	public async install(
		packageName: string,
		pathToSave: string,
		options: IPackageInstallOptions
	): Promise<INpmInstallResultInfo> {
		if (options.disableNpmInstall) {
			return;
		}

		const packageJsonPath = path.join(pathToSave, "package.json");
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getInstallFlags(options);
		let params = [];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push("add", packageName);
		}

		params = params.concat(flags);
		const cwd = pathToSave;

		try {
			const result = await this.processPackageManagerInstall(
				packageName,
				params,
				{ cwd, isInstallingAllDependencies }
			);
			return result;
		} catch (e) {
			this.$fs.writeJson(packageJsonPath, jsonContentBefore);
			throw e;
		}
	}

	@exported("yarn2")
	public uninstall(
		packageName: string,
		options?: IPackageUninstallOptions,
		cwd?: string
	): Promise<string> {
		const flags = this.getUninstallFlags(options).join(" ");
		return this.$childProcess.exec(`yarn remove ${packageName} ${flags}`, {
			cwd,
		});
	}

	@exported("yarn2")
	public async view(packageName: string, field?: string): Promise<any> {
		const args = [packageName, field && `--fields ${field}`, "--json"]
			.filter(Boolean)
			.join(" ");
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`yarn npm info ${args}`);
		} catch (e) {
			this.$errors.fail(e.message);
		}

		try {
			return JSON.parse(viewResult);
		} catch (err) {
			this.$errors.fail(err.message);
			return null;
		}
	}

	@exported("yarn2")
	public search(filter: string[]): Promise<string> {
		this.$errors.fail(
			"Method not implemented. Yarn does not support searching for packages in the registry."
		);
		return null;
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		const httpRequestResult = await this.$httpClient.httpRequest(
			`https://api.npms.io/v2/search?q=keywords:${keyword}`
		);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	@exported("yarn2")
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(
			`yarn config get npmRegistryServer`
		);
		const url = `${registry.trim()}/${packageName}`;
		this.$logger.trace(
			`Trying to get data from yarn registry for package ${packageName}, url is: ${url}`
		);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(
			`Successfully received data from yarn registry for package ${packageName}. Response data is: ${responseData}`
		);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(
			`Successfully parsed data from yarn registry for package ${packageName}.`
		);
		return jsonData;
	}

	@exported("yarn2")
	public async getCachePath(): Promise<string> {
		const result = await this.$childProcess.exec(`yarn config get cacheFolder`);
		return result.toString().trim();
	}
}

injector.register("yarn2", Yarn2PackageManager);
