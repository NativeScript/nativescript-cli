import { PackageManagers } from "../../constants";

export class PackageManagerCommand implements ICommand {

	constructor(private $userSettingsService: IUserSettingsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $stringParameter: ICommandParameter) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		const packageManagerName = args[0];
		const supportedPackageManagers = Object.keys(PackageManagers);
		if (supportedPackageManagers.indexOf(packageManagerName) === -1) {
			this.$errors.fail(`${packageManagerName} is not a valid package manager. Supported values are: ${supportedPackageManagers.join(", ")}.`);
		}

		await this.$userSettingsService.saveSetting("packageManager", packageManagerName);

		this.$logger.printMarkdown(`Please ensure you have the directory containing \`${packageManagerName}\` executable available in your PATH.`);
		this.$logger.printMarkdown(`You've successfully set \`${packageManagerName}\` as your package manager.`);
	}
}

$injector.registerCommand("package-manager|set", PackageManagerCommand);
