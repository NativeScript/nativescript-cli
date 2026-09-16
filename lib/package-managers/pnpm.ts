import * as path from "path";
import * as _ from "lodash";
import { BasePackageManager } from "./base-package-manager";
import { exported } from "../common/decorators";
import { CACACHE_DIRECTORY_NAME } from "../constants";
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

export class PnpmPackageManager extends BasePackageManager {
	protected readonly installFlags = {
		dev: "--save-dev",
		optional: "--save-optional",
		exact: "--save-exact",
		silent: "--silent",
		ignoreScripts: "--ignore-scripts",
	};
	protected readonly uninstallFlags = {};

	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		$hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		$pacoteService: IPacoteService,
	) {
		super($childProcess, $fs, $hostInfo, $pacoteService, "pnpm");
	}

	@exported("pnpm")
	public async install(
		packageName: string,
		pathToSave: string,
		options: IPackageInstallOptions,
	): Promise<INpmInstallResultInfo> {
		if (options.disableNpmInstall) {
			return;
		}

		const packageJsonPath = path.join(pathToSave, "package.json");
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getInstallFlags(options);
		let params = ["i"];
		if (!this.projectManagesOwnHoisting(pathToSave)) {
			// With pnpm's default isolated layout some imports won't be found, so
			// install "flat". Skipped when the project configures its own layout:
			// pnpm treats a hoisting flag that contradicts the stored install state
			// as a config change and rebuilds node_modules from scratch after a
			// prompt (aborting outright when there is no TTY).
			params.push("--shamefully-hoist");
		}
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
				{ cwd, isInstallingAllDependencies },
			);
			return result;
		} catch (e) {
			this.$fs.writeJson(packageJsonPath, jsonContentBefore);
			throw e;
		}
	}

	@exported("pnpm")
	public uninstall(
		packageName: string,
		options?: IPackageUninstallOptions,
		cwd?: string,
	): Promise<string> {
		const flags = this.getUninstallFlags(options).join(" ");
		return this.$childProcess.exec(`pnpm remove ${packageName} ${flags}`, {
			cwd,
		});
	}

	@exported("pnpm")
	public async view(packageName: string, field?: string): Promise<any> {
		const args = [packageName, field, "--json"].filter(Boolean).join(" ");
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`pnpm info ${args}`);
		} catch (e) {
			this.$errors.fail(e.message);
		}

		try {
			return JSON.parse(viewResult);
		} catch (err) {
			return null;
		}
	}

	@exported("pnpm")
	public async search(filter: string[]): Promise<string> {
		return this.$childProcess.exec(`pnpm search ${filter.join(" ")}`);
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		const httpRequestResult = await this.$httpClient.httpRequest(
			`https://api.npms.io/v2/search?q=keywords:${keyword}`,
		);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	@exported("pnpm")
	public async getRegistryPackageData(packageName: string): Promise<any> {
		const registry = await this.$childProcess.exec(`pnpm config get registry`);
		const url = `${registry.trim()}/${packageName}`;
		this.$logger.trace(
			`Trying to get data from pnpm registry for package ${packageName}, url is: ${url}`,
		);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(
			`Successfully received data from pnpm registry for package ${packageName}. Response data is: ${responseData}`,
		);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(
			`Successfully parsed data from pnpm registry for package ${packageName}.`,
		);
		return jsonData;
	}

	@exported("pnpm")
	public async getCachePath(): Promise<string> {
		const cachePath = await this.$childProcess.exec(`pnpm config get cache`);
		const cacheDir = cachePath && cachePath.trim();
		// pnpm has no `cache` config key of its own: modern versions print
		// "undefined" (older ones an empty string), which would yield a relative
		// garbage path. Derive a stable per-user location from the store instead.
		if (cacheDir && cacheDir !== "undefined" && cacheDir !== "null") {
			return path.join(cacheDir, CACACHE_DIRECTORY_NAME);
		}
		const storePath = await this.$childProcess.exec(`pnpm store path`);
		return path.join(path.dirname(storePath.trim()), CACACHE_DIRECTORY_NAME);
	}

	private projectManagesOwnHoisting(installDir: string): boolean {
		// A pnpm-workspace.yaml (pnpm's config home since v10) or an .npmrc with
		// a layout key marks the node_modules layout as the project's own choice.
		// The optional [] suffix covers .npmrc's array syntax (hoist-pattern[]=).
		const layoutKeyPattern =
			/^\s*(shamefully-hoist|node-linker|hoist|hoist-pattern|public-hoist-pattern)(\[\])?\s*[=:]/m;
		let dir = path.resolve(installDir);
		while (true) {
			if (this.$fs.exists(path.join(dir, "pnpm-workspace.yaml"))) {
				return true;
			}
			const npmrcPath = path.join(dir, ".npmrc");
			if (this.$fs.exists(npmrcPath)) {
				try {
					const npmrcContent = this.$fs.readText(npmrcPath);
					if (npmrcContent && layoutKeyPattern.test(npmrcContent)) {
						return true;
					}
				} catch (err) {
					this.$logger.trace(`Unable to read ${npmrcPath}. Error is: `, err);
				}
			}
			const parent = path.dirname(dir);
			if (parent === dir) {
				return false;
			}
			dir = parent;
		}
	}
}

injector.register("pnpm", PnpmPackageManager);
