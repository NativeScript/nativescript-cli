import * as path from "path";
import { BasePackageManager } from "./base-package-manager";
import { exported } from './common/decorators';
import { CACACHE_DIRECTORY_NAME } from "./constants";

export class PnpmPackageManager extends BasePackageManager {

	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		$pacoteService: IPacoteService
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, 'pnpm');
	}

	@exported("pnpm")
	public async install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo> {
		if (config.disableNpmInstall) {
			return;
		}
		if (config.ignoreScripts) {
			config['ignore-scripts'] = true;
		}

		const packageJsonPath = path.join(pathToSave, 'package.json');
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getFlagsString(config, true);
		// With pnpm we need to install as "flat" or some imports wont be found
		let params = ['i', '--shamefully-hoist'];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push(packageName);
		}

		params = params.concat(flags);
		const cwd = pathToSave;

		try {
			const result = await this.processPackageManagerInstall(packageName, params, { cwd, isInstallingAllDependencies });
			return result;
		} catch (e) {
			this.$fs.writeJson(packageJsonPath, jsonContentBefore);
			throw e;
		}
	}

	@exported("pnpm")
	public uninstall(packageName: string, config?: IDictionary<string | boolean>, cwd?: string): Promise<string> {
		// pnpm does not want save option in remove. It saves it by default
		delete config['save'];
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`pnpm remove ${packageName} ${flags}`, { cwd });
	}

	@exported("pnpm")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true });

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`pnpm info ${packageName} ${flags}`);
		} catch (e) {
			this.$errors.fail(e.message);
		}
		const result = JSON.parse(viewResult);
		return result;
	}

	@exported("pnpm")
	public search(filter: string[], config: IDictionary<string | boolean>): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`pnpm search ${filter.join(" ")} ${flags}`);
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		const httpRequestResult = await this.$httpClient.httpRequest(`https://api.npms.io/v2/search?q=keywords:${keyword}`);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	@exported("pnpm")
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`pnpm config get registry`);
		const url = `${registry.trim()}/${packageName}`;
		this.$logger.trace(`Trying to get data from pnpm registry for package ${packageName}, url is: ${url}`);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(`Successfully received data from pnpm registry for package ${packageName}. Response data is: ${responseData}`);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(`Successfully parsed data from pnpm registry for package ${packageName}.`);
		return jsonData;
	}

	@exported("pnpm")
	public async getCachePath(): Promise<string> {
		const cachePath = await this.$childProcess.exec(`pnpm config get cache`);
		return path.join(cachePath.trim(), CACACHE_DIRECTORY_NAME);
	}
}

$injector.register("pnpm", PnpmPackageManager);
