import * as path from "path";

export class PreUninstallCommand implements ICommand {
	public disableAnalytics = true;

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $fs: IFileSystem,
		private $settingsService: ISettingsService) { }

	public async execute(args: string[]): Promise<void> {
		this.$fs.deleteFile(path.join(this.$settingsService.getProfileDir(), "KillSwitches", "cli"));
	}
}

$injector.registerCommand("dev-preuninstall", PreUninstallCommand);
