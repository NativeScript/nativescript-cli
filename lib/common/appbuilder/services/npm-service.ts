import * as path from "path";
import * as os from "os";
import * as constants from "../../constants";
import { fromWindowsRelativePathToUnix, toBoolean } from "../../helpers";
import { exported } from "../../decorators";
import * as url from "url";
const { getCredentialsFromAuth } = require("proxy-lib/lib/utils");

export class NpmService implements INpmService {
	private static TYPES_DIRECTORY = "@types/";
	private static TNS_CORE_MODULES_DEFINITION_FILE_NAME = `${constants.TNS_CORE_MODULES}${constants.FileExtensions.TYPESCRIPT_DEFINITION_FILE}`;
	private static NPM_REGISTRY_URL = "http://registry.npmjs.org";
	private static SCOPED_DEPENDENCY_REGEXP = /^(@.+?)(?:@(.+?))?$/;
	private static DEPENDENCY_REGEXP = /^(.+?)(?:@(.+?))?$/;

	private _npmExecutableName: string;
	private _proxySettings: IProxySettings;
	private _hasCheckedNpmProxy = false;
	private _npmRegistryUrl: string;

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $projectConstants: Project.IConstants) { }

	private get npmExecutableName(): string {
		if (!this._npmExecutableName) {
			this._npmExecutableName = "npm";

			if (this.$hostInfo.isWindows) {
				this._npmExecutableName += ".cmd";
			}
		}

		return this._npmExecutableName;
	}

	@exported("npmService")
	public async install(projectDir: string, dependencyToInstall?: INpmDependency): Promise<INpmInstallResult> {
		const npmInstallResult: INpmInstallResult = {};

		if (dependencyToInstall) {
			npmInstallResult.result = {
				isInstalled: false,
				isTypesInstalled: false
			};

			try {
				await this.npmInstall(projectDir, dependencyToInstall.name, dependencyToInstall.version, ["--save", "--save-exact"]);
				npmInstallResult.result.isInstalled = true;
			} catch (err) {
				npmInstallResult.error = err;
			}

			if (dependencyToInstall.installTypes && npmInstallResult.result.isInstalled && await this.hasTypesForDependency(dependencyToInstall.name)) {
				try {
					await this.installTypingsForDependency(projectDir, dependencyToInstall.name);
					npmInstallResult.result.isTypesInstalled = true;
				} catch (err) {
					npmInstallResult.error = err;
				}
			}
		} else {
			try {
				await this.npmPrune(projectDir);
				await this.npmInstall(projectDir);
			} catch (err) {
				npmInstallResult.error = err;
			}
		}

		this.generateReferencesFile(projectDir);

		return npmInstallResult;
	}

	@exported("npmService")
	public async uninstall(projectDir: string, dependency: string): Promise<void> {
		const packageJsonContent = this.getPackageJsonContent(projectDir);

		if (packageJsonContent && packageJsonContent.dependencies && packageJsonContent.dependencies[dependency]) {
			await this.npmUninstall(projectDir, dependency, ["--save"]);
		}

		if (packageJsonContent && packageJsonContent.devDependencies && packageJsonContent.devDependencies[`${NpmService.TYPES_DIRECTORY}${dependency}`]) {
			await this.npmUninstall(projectDir, `${NpmService.TYPES_DIRECTORY}${dependency}`, ["--save-dev"]);
		}

		this.generateReferencesFile(projectDir);
	}

	public async search(projectDir: string, keywords: string[], args?: string[]): Promise<IBasicPluginInformation[]> {
		args = args === undefined ? [] : args;
		const result: IBasicPluginInformation[] = [];
		const commandArguments = _.concat(["search"], args, keywords);
		const spawnResult = await this.executeNpmCommandCore(projectDir, commandArguments);
		if (spawnResult.stderr) {
			// npm will write "npm WARN Building the local index for the first time, please be patient" to the stderr and if it is the only message on the stderr we should ignore it.
			const splitError = spawnResult.stderr.trim().split("\n");
			if (splitError.length > 1 || splitError[0].indexOf("Building the local index for the first time") === -1) {
				this.$errors.failWithoutHelp(spawnResult.stderr);
			}
		}

		// Need to split the result only by \n because the npm result contains only \n and on Windows it will not split correctly when using EOL.
		// Sample output:
		// NAME                    DESCRIPTION             AUTHOR        DATE       VERSION  KEYWORDS
		// cordova-plugin-console  Cordova Console Plugin  =csantanapr…  2016-04-20 1.0.3    cordova console ecosystem:cordova cordova-ios
		const pluginsRows: string[] = spawnResult.stdout.split("\n");

		// Remove the table headers row.
		pluginsRows.shift();

		const npmNameGroup = "(\\S+)";
		const npmDateGroup = "(\\d+-\\d+-\\d+)\\s";
		const npmFreeTextGroup = "([^=]+)";
		const npmAuthorsGroup = "((?:=\\S+\\s?)+)\\s+";

		// Should look like this /(\S+)\s+([^=]+)((?:=\S+\s?)+)\s+(\d+-\d+-\d+)\s(\S+)(\s+([^=]+))?/
		const pluginRowRegExp = new RegExp(`${npmNameGroup}\\s+${npmFreeTextGroup}${npmAuthorsGroup}${npmDateGroup}${npmNameGroup}(\\s+${npmFreeTextGroup})?`);

		_.each(pluginsRows, (pluginRow: string) => {
			const matches = pluginRowRegExp.exec(pluginRow.trim());

			if (!matches || !matches[0]) {
				return;
			}

			result.push({
				name: matches[1],
				description: matches[2],
				author: matches[3],
				version: matches[5]
			});
		});

		return result;
	}

	public async getPackageJsonFromNpmRegistry(packageName: string, version?: string): Promise<any> {
		const timeout = 6000;
		let packageJsonContent: any;
		version = version || "latest";
		try {
			const url = await this.buildNpmRegistryUrl(packageName),
				proxySettings = await this.getNpmProxySettings();

			// This call will return error with message '{}' in case there's no such package.
			const result = (await this.$httpClient.httpRequest({ url, timeout }, proxySettings)).body;

			const fullData = JSON.parse(result);
			const distTags = fullData["dist-tags"];
			const versions = fullData.versions;

			// check if passed version is in fact tag (for example latest, next, etc.) In this case - get the real version.
			_.each(distTags, (ver, tagName) => {
				if (tagName === version) {
					version = ver;
					return false;
				}
			});

			packageJsonContent = versions[version];
		} catch (err) {
			this.$logger.trace("Error caught while checking the NPM Registry for plugin with id: %s", packageName);
			this.$logger.trace(err.message);
		}

		return packageJsonContent;
	}

	public isScopedDependency(dependency: string): boolean {
		const matches = dependency.match(NpmService.SCOPED_DEPENDENCY_REGEXP);

		return !!(matches && matches[0]);
	}

	public getDependencyInformation(dependency: string): IDependencyInformation {
		const regExp = this.isScopedDependency(dependency) ? NpmService.SCOPED_DEPENDENCY_REGEXP : NpmService.DEPENDENCY_REGEXP;
		const matches = dependency.match(regExp);

		return {
			name: matches[1],
			version: matches[2]
		};
	}

	private async hasTypesForDependency(packageName: string): Promise<boolean> {
		return !!(await this.getPackageJsonFromNpmRegistry(`${NpmService.TYPES_DIRECTORY}${packageName}`));
	}

	private async buildNpmRegistryUrl(packageName: string): Promise<string> {
		let registryUrl = await this.getNpmRegistryUrl();
		if (!_.endsWith(registryUrl, "/")) {
			registryUrl += "/";
		}

		return `${registryUrl}${packageName.replace("/", "%2F")}`;
	}

	private async getNpmRegistryUrl(): Promise<string> {
		if (!this._npmRegistryUrl) {
			let currentNpmRegistry: string;

			try {
				currentNpmRegistry = (await this.$childProcess.exec("npm config get registry") || "").toString().trim();
			} catch (err) {
				this.$logger.trace(`Unable to get registry from npm config. Error is ${err.message}.`);
			}

			this._npmRegistryUrl = currentNpmRegistry || NpmService.NPM_REGISTRY_URL;

			this.$logger.trace(`Npm registry is: ${this._npmRegistryUrl}.`);
		}

		return this._npmRegistryUrl;
	}

	private getPackageJsonContent(projectDir: string): any {
		const pathToPackageJson = this.getPathToPackageJson(projectDir);

		try {
			return this.$fs.readJson(pathToPackageJson);
		} catch (err) {
			if (err.code === "ENOENT") {
				this.$errors.failWithoutHelp(`Unable to find ${this.$projectConstants.PACKAGE_JSON_NAME} in ${projectDir}.`);
			}

			throw err;
		}
	}

	private getPathToPackageJson(projectDir: string): string {
		return path.join(projectDir, this.$projectConstants.PACKAGE_JSON_NAME);
	}

	private getPathToReferencesFile(projectDir: string): string {
		return path.join(projectDir, this.$projectConstants.REFERENCES_FILE_NAME);
	}

	private async installTypingsForDependency(projectDir: string, dependency: string): Promise<ISpawnResult> {
		return this.npmInstall(projectDir, `${NpmService.TYPES_DIRECTORY}${dependency}`, null, ["--save-dev", "--save-exact"]);
	}

	private generateReferencesFile(projectDir: string): void {
		const packageJsonContent = this.getPackageJsonContent(projectDir);

		const pathToReferenceFile = this.getPathToReferencesFile(projectDir);
		let lines: string[] = [];

		if (packageJsonContent && packageJsonContent.dependencies && packageJsonContent.dependencies[constants.TNS_CORE_MODULES]) {
			const relativePathToTnsCoreModulesDts = `./${constants.NODE_MODULES_DIR_NAME}/${constants.TNS_CORE_MODULES}/${NpmService.TNS_CORE_MODULES_DEFINITION_FILE_NAME}`;

			if (this.$fs.exists(path.join(projectDir, relativePathToTnsCoreModulesDts))) {
				lines.push(this.getReferenceLine(relativePathToTnsCoreModulesDts));
			}
		}

		_(packageJsonContent.devDependencies)
			.keys()
			.each(devDependency => {
				if (this.isFromTypesRepo(devDependency)) {
					const nodeModulesDirectory = path.join(projectDir, constants.NODE_MODULES_DIR_NAME);
					const definitionFiles = this.$fs.enumerateFilesInDirectorySync(path.join(nodeModulesDirectory, devDependency),
						(file, stat) => _.endsWith(file, constants.FileExtensions.TYPESCRIPT_DEFINITION_FILE) || stat.isDirectory(), { enumerateDirectories: false });

					const defs = _.map(definitionFiles, def => this.getReferenceLine(fromWindowsRelativePathToUnix(path.relative(projectDir, def))));

					this.$logger.trace(`Adding lines for definition files: ${definitionFiles.join(", ")}`);
					lines = lines.concat(defs);
				}
			});

		// TODO: Make sure the android17.d.ts and ios.d.ts are added.

		if (lines.length) {
			this.$logger.trace("Updating reference file with new entries...");
			this.$fs.writeFile(pathToReferenceFile, lines.join(os.EOL), "utf8");

			// Our old name for the file which contains the definitions imports was .abreferences.d.ts.
			// TypeScript 2.0 does not respect hidden definition files and we had to rename the file.
			this.removeOldAbReferencesFile(projectDir);
		} else {
			this.$logger.trace(`Could not find any .d.ts files for ${this.$projectConstants.REFERENCES_FILE_NAME} file. Deleting the old file.`);
			this.$fs.deleteFile(pathToReferenceFile);
		}
	}

	private removeOldAbReferencesFile(projectDir: string): void {
		const pathToOldReferencesFile = path.join(projectDir, this.$projectConstants.OLD_REFERENCES_FILE_NAME);

		if (this.$fs.exists(pathToOldReferencesFile)) {
			this.$fs.deleteFile(pathToOldReferencesFile);
		}
	}

	private isFromTypesRepo(dependency: string): boolean {
		return !!dependency.match(/^@types\//);
	}

	private getReferenceLine(pathToReferencedFile: string): string {
		return `/// <reference path="${pathToReferencedFile}" />`;
	}

	private getNpmArguments(command: string, npmArguments?: string[]): string[] {
		npmArguments = npmArguments === undefined ? [] : npmArguments;
		return npmArguments.concat([command]);
	}

	private async npmInstall(projectDir: string, dependency?: string, version?: string, npmArguments?: string[]): Promise<ISpawnResult> {
		return this.executeNpmCommand(projectDir, this.getNpmArguments("install", npmArguments), dependency, version);
	}

	private async npmUninstall(projectDir: string, dependency?: string, npmArguments?: string[]): Promise<ISpawnResult> {
		return this.executeNpmCommand(projectDir, this.getNpmArguments("uninstall", npmArguments), dependency, null);
	}

	private async npmPrune(projectDir: string, dependency?: string, version?: string): Promise<ISpawnResult> {
		return this.executeNpmCommand(projectDir, this.getNpmArguments("prune"), dependency, version);
	}

	private async executeNpmCommand(projectDir: string, npmArguments: string[], dependency: string, version?: string): Promise<ISpawnResult> {
		if (dependency) {
			let dependencyToInstall = dependency;
			if (version) {
				dependencyToInstall += `@${version}`;
			}

			npmArguments.push(dependencyToInstall);
		}

		return await this.executeNpmCommandCore(projectDir, npmArguments);
	}

	private async executeNpmCommandCore(projectDir: string, npmArguments: string[]): Promise<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(this.npmExecutableName, npmArguments, "close", { cwd: projectDir, stdio: "inherit" });
	}

	private async getNpmProxySettings(): Promise<IProxySettings> {
		if (!this._hasCheckedNpmProxy) {
			try {
				const npmProxy = (await this.$childProcess.exec("npm config get proxy") || "").toString().trim();

				// npm will return null as string in case there's no proxy set.
				if (npmProxy && npmProxy !== "null") {
					const strictSslString = (await this.$childProcess.exec("npm config get strict-ssl") || "").toString().trim();
					const uri = url.parse(npmProxy);
					const { username, password } = getCredentialsFromAuth(uri.auth || "");

					this._proxySettings = {
						hostname: uri.hostname,
						port: uri.port,
						rejectUnauthorized: toBoolean(strictSslString),
						username,
						password
					};
				}
			} catch (err) {
				this.$logger.trace(`Unable to get npm proxy configuration. Error is: ${err.message}.`);
			}

			this.$logger.trace("Npm proxy is: ", this._proxySettings);

			this._hasCheckedNpmProxy = true;
		}

		return this._proxySettings;
	}
}
$injector.register("npmService", NpmService);
