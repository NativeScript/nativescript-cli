import * as path from "path";
import { color } from "../color";
import { IChildProcess, IErrors } from "../common/declarations";
import {
	booleanOption,
	Command,
	CommandOptionsSchema,
} from "../common/define-command";
import { inject } from "../common/di";
import { PackageManagers } from "../constants";
import { IPackageManager } from "../declarations";
import { IProjectData } from "../definitions/project";

const PREVIEW_CLI_PACKAGE = "@nativescript/preview-cli";

const previewCommandOptions = {
	disableNpmInstall: booleanOption(),
} satisfies CommandOptionsSchema;

export class PreviewCommand extends Command({
	name: "preview",
	description: "Runs your project with the NativeScript Preview CLI.",
	options: previewCommandOptions,
	// Arguments have never been rejected here, only ignored: they reach the
	// preview CLI through the raw argv instead.
	arguments: "any",
	allowUnknownOptions: true,
}) {
	private $childProcess = inject<IChildProcess>("childProcess");
	private $errors = inject<IErrors>("errors");
	private $logger = inject<ILogger>("logger");
	private $packageManager = inject<IPackageManager>("packageManager");
	private $projectData = inject<IProjectData>("projectData");

	public async run(): Promise<void> {
		if (!this.options.disableNpmInstall) {
			await this.installLatestPreviewCLI();
		}

		const previewCLIPath = this.getPreviewCLIPath();

		if (!previewCLIPath) {
			await this.failMissingPreviewCLI();
		}

		const previewCLIBinPath = path.resolve(previewCLIPath, "./dist/index.js");
		this.spawnPreviewCLI(previewCLIBinPath);
	}

	private async installLatestPreviewCLI(): Promise<void> {
		await this.$packageManager.install(
			`${PREVIEW_CLI_PACKAGE}@latest`,
			this.$projectData.projectDir,
			{
				dev: true,
				exact: true,
			},
		);
	}

	private getPreviewCLIPath(): string {
		return this.$packageManager.getInstalledPackagePath(
			PREVIEW_CLI_PACKAGE,
			this.$projectData.projectDir,
		);
	}

	private async failMissingPreviewCLI(): Promise<void> {
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
				"And if you are still having issues, try again - or reach out on Discord/open an issue on GitHub.",
			].join("\n"),
		);

		this.$errors.fail("Running preview failed.");
	}

	private spawnPreviewCLI(previewCLIBinPath: string): void {
		// The preview CLI takes the command line verbatim, including flags this CLI
		// does not know, so the raw process arguments are what it gets rather than
		// anything the command layer parsed.
		const commandIndex = process.argv.indexOf("preview");
		const commandArgs = process.argv.slice(commandIndex + 1);
		this.$childProcess.spawn(
			process.execPath,
			[previewCLIBinPath, ...commandArgs],
			{
				stdio: "inherit",
			},
		);
	}
}
