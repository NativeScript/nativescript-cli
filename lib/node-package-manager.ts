import { join, relative } from "path";
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

export class NodePackageManager extends BasePackageManager {
	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		$pacoteService: IPacoteService,
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, "npm");
	}

	@exported("npm")
	public async install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions,
	): Promise<INpmInstallResultInfo> {
		if (config.disableNpmInstall) {
			return;
		}
		if (config.legacyPeers) {
			config["legacy-peer-deps"] = true;
		}
		delete (config as any).legacyPeers;
		if (config.ignoreScripts) {
			config["ignore-scripts"] = true;
		}

		const packageJsonPath = join(pathToSave, "package.json");
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getFlagsString(config, true);
		let params = ["install"];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push(packageName);
		}

		params = params.concat(flags);
		const cwd = pathToSave;
		// Npm creates `etc` directory in installation dir when --prefix is passed
		// https://github.com/npm/npm/issues/11486
		// we should delete it if it was created because of us
		const etcDirectoryLocation = join(cwd, "etc");
		const etcExistsPriorToInstallation = this.$fs.exists(etcDirectoryLocation);

		//TODO: plamen5kov: workaround is here for a reason (remove whole file later)
		if (config.path) {
			let relativePathFromCwdToSource = "";
			if (config.frameworkPath) {
				relativePathFromCwdToSource = relative(
					config.frameworkPath,
					pathToSave,
				);
				if (this.$fs.exists(relativePathFromCwdToSource)) {
					packageName = relativePathFromCwdToSource;
				}
			}
		}

		try {
			const result = await this.processPackageManagerInstall(
				packageName,
				params,
				{ cwd, isInstallingAllDependencies },
			);
			return result;
		} catch (err) {
			if (err.message && err.message.indexOf("EPEERINVALID") !== -1) {
				// Not installed peer dependencies are treated by npm 2 as errors, but npm 3 treats them as warnings.
				// We'll show them as warnings and let the user install them in case they are needed.
				this.$logger.warn(err.message);
			} else {
				// All other errors should be handled by the caller code.
				// Revert package.json contents to preserve valid state
				this.$fs.writeJson(packageJsonPath, jsonContentBefore);
				throw err;
			}
		} finally {
			if (!etcExistsPriorToInstallation) {
				this.$fs.deleteDirectory(etcDirectoryLocation);
			}
		}
	}

	@exported("npm")
	public async uninstall(
		packageName: string,
		config?: any,
		path?: string,
	): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm uninstall ${packageName} ${flags}`, {
			cwd: path,
		});
	}

	@exported("npm")
	public async search(filter: string[], config: any): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm search ${filter.join(" ")} ${flags}`);
	}

	@exported("npm")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true }); // always require view response as JSON

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(
				`npm view ${packageName} ${flags}`,
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

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		// TODO: Fix the generation of url - in case it contains @ or / , the call may fail.
		const httpRequestResult = await this.$httpClient.httpRequest(
			`https://api.npms.io/v2/search?q=keywords:${keyword}`,
		);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`npm config get registry`);
		const url = registry.trim() + packageName;
		this.$logger.trace(
			`Trying to get data from npm registry for package ${packageName}, url is: ${url}`,
		);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(
			`Successfully received data from npm registry for package ${packageName}. Response data is: ${responseData}`,
		);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(
			`Successfully parsed data from npm registry for package ${packageName}.`,
		);
		return jsonData;
	}

	@cache()
	public async getCachePath(): Promise<string> {
		const cachePath = await this.$childProcess.exec(`npm config get cache`);
		return join(cachePath.trim(), CACACHE_DIRECTORY_NAME);
	}
}

injector.register("npm", NodePackageManager);
