import * as path from "path";
import { cache, exported } from "../common/decorators";
import * as constants from "../constants";
import { createRegExp, regExpEscape } from "../common/helpers";

export class ExtensibilityService implements IExtensibilityService {
	private get pathToExtensions(): string {
		return path.join(this.$settingsService.getProfileDir(), "extensions");
	}

	private get pathToPackageJson(): string {
		return path.join(this.pathToExtensions, constants.PACKAGE_JSON_FILE_NAME);
	}

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $npm: INodePackageManager,
		private $settingsService: ISettingsService,
		private $requireService: IRequireService) {
	}

	@exported("extensibilityService")
	public async installExtension(extensionName: string): Promise<IExtensionData> {
		this.$logger.trace(`Start installation of extension '${extensionName}'.`);

		await this.assertPackageJsonExists();

		const npmOpts: any = {
			save: true,
			["save-exact"]: true
		};

		const localPath = path.resolve(extensionName);
		const packageName = this.$fs.exists(localPath) ? localPath : extensionName;

		const installResultInfo = await this.$npm.install(packageName, this.pathToExtensions, npmOpts);
		this.$logger.trace(`Finished installation of extension '${extensionName}'. Trying to load it now.`);

		return this.getInstalledExtensionData(installResultInfo.name);
	}

	@exported("extensibilityService")
	public async uninstallExtension(extensionName: string): Promise<void> {
		this.$logger.trace(`Start uninstallation of extension '${extensionName}'.`);

		await this.assertPackageJsonExists();

		await this.$npm.uninstall(extensionName, { save: true }, this.pathToExtensions);

		this.$logger.trace(`Finished uninstallation of extension '${extensionName}'.`);
	}

	public getInstalledExtensionsData(): IExtensionData[] {
		const installedExtensions = this.getInstalledExtensions();
		return _.keys(installedExtensions).map(installedExtension => this.getInstalledExtensionData(installedExtension));
	}

	@exported("extensibilityService")
	public loadExtensions(): Promise<IExtensionData>[] {
		this.$logger.trace("Loading extensions.");

		let dependencies: IStringDictionary = null;

		try {
			dependencies = this.getInstalledExtensions();
		} catch (err) {
			this.$logger.trace(`Error while getting installed dependencies: ${err.message}. No extensions will be loaded.`);
		}

		return _.keys(dependencies)
			.map(name => this.loadExtension(name));
	}

	@exported("extensibilityService")
	public getInstalledExtensions(): IStringDictionary {
		if (this.$fs.exists(this.pathToPackageJson)) {
			return this.$fs.readJson(this.pathToPackageJson).dependencies;
		}

		return null;
	}

	private getInstalledExtensionData(extensionName: string): IExtensionData {
		const packageJsonData = this.getExtensionPackageJsonData(extensionName);
		const pathToExtension = this.getPathToExtension(extensionName);
		const docs = packageJsonData && packageJsonData.nativescript && packageJsonData.nativescript.docs && path.join(pathToExtension, packageJsonData.nativescript.docs);
		return {
			extensionName: packageJsonData.name,
			version: packageJsonData.version,
			docs,
			pathToExtension
		};
	}

	@exported("extensibilityService")
	public async loadExtension(extensionName: string): Promise<IExtensionData> {
		try {
			await this.assertExtensionIsInstalled(extensionName);

			const pathToExtension = this.getPathToExtension(extensionName);
			this.$requireService.require(pathToExtension);
			return this.getInstalledExtensionData(extensionName);
		} catch (error) {
			this.$logger.warn(`Error while loading ${extensionName} is: ${error.message}`);
			const err = <IExtensionLoadingError>new Error(`Unable to load extension ${extensionName}. You will not be able to use the functionality that it adds. Error: ${error.message}`);
			err.extensionName = extensionName;
			throw err;
		}
	}

	public async getExtensionNameWhereCommandIsRegistered(inputOpts: IGetExtensionCommandInfoParams): Promise<IExtensionCommandInfo> {
		let allExtensions: INpmsSingleResultData[] = [];

		try {
			const npmsResult = await this.$npm.searchNpms("nativescript:extension");
			allExtensions = npmsResult.results || [];
		} catch (err) {
			this.$logger.trace(`Unable to find extensions via npms. Error is: ${err}`);
			return null;
		}

		const defaultCommandRegExp = new RegExp(`${regExpEscape(inputOpts.defaultCommandDelimiter)}.*`);
		const commandDelimiterRegExp = createRegExp(inputOpts.commandDelimiter, "g");

		for (const extensionData of allExtensions) {
			const extensionName = extensionData.package.name;

			try {
				// now get full package.json for the latest version of the package
				const registryData = await this.$npm.getRegistryPackageData(extensionName);
				const latestPackageData = registryData.versions[registryData["dist-tags"].latest];
				const commands: string[] = latestPackageData && latestPackageData.nativescript && latestPackageData.nativescript.commands;
				if (commands && commands.length) {
					// For each default command we need to add its short syntax in the array of commands.
					// For example in case there's a default command called devices list, the commands array will contain devices|*list.
					// However, in case the user executes just tns devices, CLI will still execute the tns devices list command.
					// So we need to add the devices command as well.
					_.filter(commands, command => command.indexOf(inputOpts.defaultCommandDelimiter) !== -1)
						.forEach(defaultCommand => {
							commands.push(defaultCommand.replace(defaultCommandRegExp, ""));
						});

					const copyOfFullArgs = _.clone(inputOpts.inputStrings);
					while (copyOfFullArgs.length) {
						const currentCommand = copyOfFullArgs.join(inputOpts.commandDelimiter).toLowerCase();

						if (_.some(commands, c => c.toLowerCase() === currentCommand)) {
							const beautifiedCommandName = currentCommand.replace(commandDelimiterRegExp, " ");
							return {
								extensionName,
								registeredCommandName: currentCommand,
								installationMessage: `The command ${beautifiedCommandName} is registered in extension ${extensionName}. You can install it by executing 'tns extension install ${extensionName}'`
							};
						}

						copyOfFullArgs.splice(-1, 1);
					}
				}
			} catch (err) {
				// We do not want to stop the whole process in case we are unable to find data for one of the extensions.
				this.$logger.trace(`Unable to get data for ${extensionName}. Error is: ${err}`);
			}
		}

		return null;
	}

	private getPathToExtension(extensionName: string): string {
		return path.join(this.pathToExtensions, constants.NODE_MODULES_FOLDER_NAME, extensionName);
	}

	private getExtensionPackageJsonData(extensionName: string): any {
		const pathToExtension = this.getPathToExtension(extensionName);
		const pathToPackageJson = path.join(pathToExtension, constants.PACKAGE_JSON_FILE_NAME);
		const jsonData = this.$fs.readJson(pathToPackageJson);
		return jsonData;
	}

	private async assertExtensionIsInstalled(extensionName: string): Promise<void> {
		this.$logger.trace(`Asserting extension ${extensionName} is installed.`);
		const installedExtensions = this.$fs.readDirectory(path.join(this.pathToExtensions, constants.NODE_MODULES_FOLDER_NAME));

		if (installedExtensions.indexOf(extensionName) === -1) {
			this.$logger.trace(`Extension ${extensionName} is not installed, starting installation.`);
			await this.installExtension(extensionName);
		}

		this.$logger.trace(`Extension ${extensionName} is installed.`);
	}

	@cache()
	private assertExtensionsDirExists(): void {
		if (!this.$fs.exists(this.pathToExtensions)) {
			this.$fs.createDirectory(this.pathToExtensions);
		}
	}

	@cache()
	private assertPackageJsonExists(): void {
		this.assertExtensionsDirExists();

		if (!this.$fs.exists(this.pathToPackageJson)) {
			this.$logger.trace(`Creating ${this.pathToPackageJson}.`);

			// create default package.json
			this.$fs.writeJson(this.pathToPackageJson, {
				name: "nativescript-extensibility",
				version: "1.0.0",
				description: "The place where all packages that extend CLI will be installed.",
				license: "Apache-2.0",
				readme: "The place where all packages that extend CLI will be installed.",
				repository: "none",
				dependencies: {}
			});

			this.$logger.trace(`Created ${this.pathToPackageJson}.`);
		}
	}
}

$injector.register("extensibilityService", ExtensibilityService);
