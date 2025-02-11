import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IChildProcess, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import { IOptions, IPackageManager } from "../declarations";
import { IProjectData } from "../definitions/project";
import { resolvePackagePath } from "@rigor789/resolve-package-path";
import { PackageManagers } from "../constants";
import { color } from "../color";
import * as path from "path";

const PREVIEW_CLI_PACKAGE = "@nativescript/preview-cli";

export class PreviewCommand implements ICommand {
	allowedParameters: ICommandParameter[] = [];

	constructor(
		private $logger: ILogger,
		private $errors: IErrors,
		private $projectData: IProjectData,
		private $packageManager: IPackageManager,
		private $childProcess: IChildProcess,
		private $options: IOptions
	) {}

	private getPreviewCLIPath(): string {
		return resolvePackagePath(PREVIEW_CLI_PACKAGE, {
			paths: [this.$projectData.projectDir]
		});
	}

	async execute(args: string[]): Promise<void> {
		if (!this.$options.disableNpmInstall) {
			// ensure latest is installed
			await this.$packageManager.install(
				`${PREVIEW_CLI_PACKAGE}@latest`,
				this.$projectData.projectDir,
				{
					"save-dev": true,
					"save-exact": true
				} as any
			);
		}

		const previewCLIPath = this.getPreviewCLIPath();

		if (!previewCLIPath) {
			const packageManagerName =
				await this.$packageManager.getPackageManagerName();
			let installCommand = "";

			switch (packageManagerName) {
				case PackageManagers.yarn:
				case PackageManagers.yarn2:
					installCommand = "yarn add -D @nativescript/preview-cli";
					break;
				case PackageManagers.pnpm:
					installCommand = "pnpm install --save-dev @nativescript/preview-cli";
					break;
				case PackageManagers.bun:
					installCommand = "bun add --dev @nativescript/preview-cli";
				case PackageManagers.npm:
				default:
					installCommand = "npm install --save-dev @nativescript/preview-cli";
					break;
			}
			this.$logger.info(
				[
					`Uhh ohh, no Preview CLI found.`,
					"",
					`This should not happen under regular circumstances, but seems like it did somehow... :(`,
					`Good news though, you can install the Preview CLI by running`,
					"",
					"  " + color.green(installCommand),
					"",
					"Once installed, run this command again and everything should work!",
					"If it still fails, you can invoke the preview-cli directly as a last resort with",
					"",
					color.cyan("  ./node_modules/.bin/preview-cli"),
					"",
					"And if you are still having issues, try again - or reach out on Discord/open an issue on GitHub."
				].join("\n")
			);

			this.$errors.fail("Running preview failed.");
		}

		const previewCLIBinPath = path.resolve(previewCLIPath, "./dist/index.js");

		const commandIndex = process.argv.indexOf("preview");
		const commandArgs = process.argv.slice(commandIndex + 1);
		this.$childProcess.spawn(
			process.execPath,
			[previewCLIBinPath, ...commandArgs],
			{
				stdio: "inherit"
			}
		);
	}

	async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}

injector.registerCommand("preview", PreviewCommand);
