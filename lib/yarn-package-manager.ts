import * as path from "path";
import { BasePackageManager } from "./base-package-manager";
import { exported } from './common/decorators';
import { isInteractive } from "./common/helpers";

export class YarnPackageManager extends BasePackageManager implements INodePackageManager {

	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $pacoteService: IPacoteService
	) {
		super('yarn');
	}

	@exported("yarn")
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
		let params = [];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push('add', packageName);
		}

		params = params.concat(flags);
		const cwd = pathToSave;

		try {
			await this._getYarnInstallResult(params, cwd);

			if (isInstallingAllDependencies) {
				return null;
			}

			const packageMetadata = await this.$pacoteService.manifest(packageName, {});
			return {
				name: packageMetadata.name,
				version: packageMetadata.version
			};

		} catch (e) {
			this.$fs.writeJson(packageJsonPath, jsonContentBefore);
			throw e;
		}
	}

	@exported("yarn")
	public uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`yarn remove ${packageName} ${flags}`, { cwd: path });
	}

	@exported("yarn")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true });

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`yarn info ${packageName} ${flags}`);
		} catch (e) {
			this.$errors.failWithoutHelp(e.message);
		}
		return JSON.parse(viewResult);
	}

	@exported("yarn")
	public search(filter: string[], config: IDictionary<string | boolean>): Promise<string> {
		throw new Error("Method not implemented. Yarn does not support searching for packages in the registry.");
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		const httpRequestResult = await this.$httpClient.httpRequest(`https://api.npms.io/v2/search?q=keywords:${keyword}`);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	@exported("yarn")
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`yarn config get registry`);
		const url =  registry.trim() + packageName;
		this.$logger.trace(`Trying to get data from yarn registry for package ${packageName}, url is: ${url}`);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(`Successfully received data from yarn registry for package ${packageName}. Response data is: ${responseData}`);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(`Successfully parsed data from yarn registry for package ${packageName}.`);
		return jsonData;
	}

	private async _getYarnInstallResult(params: string[], cwd: string): Promise<ISpawnResult> {
		return new Promise<ISpawnResult>(async (resolve, reject) => {
			const npmExecutable = this.getNpmExecutableName(this.$hostInfo.isWindows);
			const stdioValue = isInteractive() ? "inherit" : "pipe";
			const childProcess = this.$childProcess.spawn(npmExecutable, params, { cwd, stdio: stdioValue });
			try {
				await this.processPackageManagerInstall(childProcess, this.$hostInfo.isWindows, params);
				resolve();
			} catch (e) {
				reject(e);
			}

		});
	}

	@exported("yarn")
	getCachePath(): Promise<string> {
		throw new Error("Method not implemented.");
	}
}

$injector.register("yarn", YarnPackageManager);
