import * as path from "path";
import * as _ from "lodash";
import { BasePackageManager } from "./base-package-manager";
import { exported } from "./common/decorators";
import {
	INodePackageManagerInstallOptions,
	INpmInstallResultInfo,
	INpmsResult,
} from "./declarations";
import {
	IChildProcess,
	IErrors,
	IFileSystem,
	IHostInfo,
	Server,
	IDictionary,
} from "./common/declarations";
import { injector } from "./common/yok";

export class YarnPackageManager extends BasePackageManager {
	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		$pacoteService: IPacoteService
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, "yarn");
	}

	@exported("yarn")
	public async install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions
	): Promise<INpmInstallResultInfo> {
		if (config.disableNpmInstall) {
			return;
		}
		if (config.ignoreScripts) {
			config["ignore-scripts"] = true;
		}

		const packageJsonPath = path.join(pathToSave, "package.json");
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getFlagsString(config, true);
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

	@exported("yarn")
	public uninstall(
		packageName: string,
		config?: IDictionary<string | boolean>,
		cwd?: string
	): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`yarn remove ${packageName} ${flags}`, {
			cwd,
		});
	}

	@exported("yarn")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true });

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(
				`yarn info ${packageName} ${flags}`
			);
		} catch (e) {
			this.$errors.fail(e.message);
		}

		try {
			const result = JSON.parse(viewResult);
			return result.data;
		} catch (err) {
			return null;
		}
	}

	@exported("yarn")
	public search(
		filter: string[],
		config: IDictionary<string | boolean>
	): Promise<string> {
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

	@exported("yarn")
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`yarn config get registry`);
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

	@exported("yarn")
	public async getCachePath(): Promise<string> {
		const result = await this.$childProcess.exec(`yarn cache dir`);
		return result.toString().trim();
	}
}

injector.register("yarn", YarnPackageManager);
