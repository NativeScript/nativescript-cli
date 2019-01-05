import * as path from "path";

export class PreUninstallCommand implements ICommand {
	public disableAnalytics = true;

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $extensibilityService: IExtensibilityService,
		private $fs: IFileSystem,
		private $packageInstallationManager: IPackageInstallationManager,
		private $settingsService: ISettingsService) { }

	public async execute(args: string[]): Promise<void> {
		if (this.isIntentionalUninstall()) {
			this.handleIntentionalUninstall();
		}

		this.$fs.deleteFile(path.join(this.$settingsService.getProfileDir(), "KillSwitches", "cli"));
	}

	private isIntentionalUninstall(): boolean {
		let isIntentionalUninstall = false;
		if (process.env && process.env.npm_config_argv) {
			try {
				const npmConfigArgv = JSON.parse(process.env.npm_config_argv);
				const uninstallAliases = ["uninstall", "remove", "rm", "r", "un", "unlink"];
				if (_.intersection(npmConfigArgv.original, uninstallAliases).length > 0) {
					isIntentionalUninstall = true;
				}
			} catch (error) {
				// ignore
			}

		}

		return isIntentionalUninstall;
	}

	private handleIntentionalUninstall(): void {
		this.$extensibilityService.removeAllExtensions();
		this.$packageInstallationManager.clearInspectorCache();
	}
}

$injector.registerCommand("dev-preuninstall", PreUninstallCommand);
