import * as path from "path";
import { doesCurrentNpmCommandMatch } from "../helpers";

export class PreUninstallCommand implements ICommand {
	public disableAnalytics = true;

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $extensibilityService: IExtensibilityService,
		private $fs: IFileSystem,
		private $packageInstallationManager: IPackageInstallationManager,
		private $settingsService: ISettingsService) { }

	public async execute(args: string[]): Promise<void> {
		const isIntentionalUninstall = doesCurrentNpmCommandMatch([/^uninstall$/, /^remove$/, /^rm$/, /^r$/, /^un$/, /^unlink$/]);
		if (isIntentionalUninstall) {
			this.handleIntentionalUninstall();
		}

		this.$fs.deleteFile(path.join(this.$settingsService.getProfileDir(), "KillSwitches", "cli"));
	}

	private handleIntentionalUninstall(): void {
		this.$extensibilityService.removeAllExtensions();
		this.$packageInstallationManager.clearInspectorCache();
	}
}

$injector.registerCommand("dev-preuninstall", PreUninstallCommand);
