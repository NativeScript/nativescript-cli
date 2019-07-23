
export class PackageManagerCommand implements ICommand {

	constructor(private $userSettingsService: IUserSettingsService,
		private $errors: IErrors,
		private $stringParameter: ICommandParameter) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public execute(args: string[]): Promise<void> {
		if (args[0] === 'yarn') {
			return this.$userSettingsService.saveSetting("packageManager", "yarn");
		} else if (args[0] === 'npm') {
			return this.$userSettingsService.saveSetting("packageManager", "npm");
		}
		return this.$errors.failWithHelp(`${args[0]} is not a valid package manager. Only yarn or npm are supported.`);
	}
}

$injector.registerCommand("package-manager|set", PackageManagerCommand);
