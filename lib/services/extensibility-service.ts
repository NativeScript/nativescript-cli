import * as path from "path";
import { cache, exported } from "../common/decorators";
import * as constants from "../constants";

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

		const packageJsonData = this.getExtensionPackageJsonData(installResultInfo.name);

		const pathToExtension = this.getPathToExtension(extensionName);
		const docs = packageJsonData && packageJsonData.nativescript && packageJsonData.nativescript.docs && path.join(pathToExtension, packageJsonData.nativescript.docs);
		return {
			extensionName: installResultInfo.name,
			version: installResultInfo.version,
			docs,
			pathToExtension
		};
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
		return _.keys(installedExtensions).map(installedExtension => {
			return this.getInstalledExtensionData(installedExtension);
		});
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
