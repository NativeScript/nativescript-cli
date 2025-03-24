import * as path from "path";
import { BasePackageManager } from "./base-package-manager";
import { exported, cache } from "./common/decorators";
import { CACACHE_DIRECTORY_NAME } from "./constants";
import * as _ from "lodash";
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
} from "./common/declarations";
import { injector } from "./common/yok";

export class BunPackageManager extends BasePackageManager {
	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		$pacoteService: IPacoteService
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, "bun");
	}

	@exported("bun")
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
		let params = ["install"];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push(packageName);
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
		} catch (err) {
			// Revert package.json contents to preserve valid state
			this.$fs.writeJson(packageJsonPath, jsonContentBefore);
			throw err;
		}
	}

	@exported("bun")
	public async uninstall(
		packageName: string,
		config?: any,
		cwd?: string
	): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`bun remove ${packageName} ${flags}`, {
			cwd,
		});
	}

	// Bun does not have a `view` command; use npm.
	@exported("bun")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true }); // always require view response as JSON

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(
				`npm view ${packageName} ${flags}`
			);
		} catch (e) {
			this.$errors.fail(e.message);
		}

		try {
			return JSON.parse(viewResult);
		} catch (err) {
			return null;
		}
	}

	// Bun does not have a `search` command; use npm.
	@exported("bun")
	public async search(filter: string[], config: any): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm search ${filter.join(" ")} ${flags}`);
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		// Bugs with npms.io:
		// 1. API returns no results when a valid package name contains @ or /
		//    even if using encodeURIComponent().
		// 2. npms.io's API no longer returns updated results; see
		//    https://github.com/npms-io/npms-api/issues/112. Better to switch to
		//    https://registry.npmjs.org/<query>
		const httpRequestResult = await this.$httpClient.httpRequest(
			`https://api.npms.io/v2/search?q=keywords:${keyword}`
		);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	// Bun does not have a command analogous to `npm config get registry`; Bun
	// uses `bunfig.toml` to define custom registries.
	// - TODO: read `bunfig.toml`, if it exists, and return the registry URL.
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`npm config get registry`);
		const url = registry.trim() + packageName;
		this.$logger.trace(
			`Trying to get data from npm registry for package ${packageName}, url is: ${url}`
		);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(
			`Successfully received data from npm registry for package ${packageName}. Response data is: ${responseData}`
		);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(
			`Successfully parsed data from npm registry for package ${packageName}.`
		);
		return jsonData;
	}

	@cache()
	public async getCachePath(): Promise<string> {
		const cachePath = await this.$childProcess.exec(`bun pm cache`);
		return path.join(cachePath.trim(), CACACHE_DIRECTORY_NAME);
	}
}

injector.register("bun", BunPackageManager);
