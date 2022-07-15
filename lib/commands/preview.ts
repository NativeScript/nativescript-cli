import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IChildProcess, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import { IOptions, IPackageManager } from "../declarations";
import { IProjectData } from "../definitions/project";
import path = require("path");
import { resolvePackagePath } from "@rigor789/resolve-package-path";
import { PackageManagers } from "../constants";

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
			paths: [this.$projectData.projectDir],
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
					"save-exact": true,
				} as any
			);
		}

		const previewCLIPath = this.getPreviewCLIPath();

		if (!previewCLIPath) {
			const packageManagerName = await this.$packageManager.getPackageManagerName();
			let installCommand = "";

			switch (packageManagerName) {
				case PackageManagers.npm:
					installCommand = "npm install --save-dev @nativescript/preview-cli";
					break;
				case PackageManagers.yarn:
					installCommand = "yarn add -D @nativescript/preview-cli";
					break;
				case PackageManagers.pnpm:
					installCommand = "pnpm install --save-dev @nativescript/preview-cli";
					break;
			}
			this.$logger.info(
				[
					`Uhh ohh, no Preview CLI found.`,
					"",
					`This should not happen under regular circumstances, but seems like it did somehow... :(`,
					`Good news though, you can install the Preview CLI by running`,
					"",
					"  " + installCommand.green,
					"",
					"Once installed, run this command again and everything should work!",
					"If it still fails, you can invoke the preview-cli directly as a last resort with",
					"",
					"  ./node_modules/.bin/preview-cli".cyan,
					"",
					"And if you are still having issues, try again - or reach out on Discord/open an issue on GitHub.",
				].join("\n")
			);

			this.$errors.fail("Running preview failed.");
		}

		const previewCLIBinPath = path.resolve(previewCLIPath, "./dist/index.js");

		const commandIndex = process.argv.indexOf("preview");
		const commandArgs = process.argv.slice(commandIndex + 1);
		this.$childProcess.spawn(previewCLIBinPath, commandArgs, {
			stdio: "inherit",
		});
	}

	async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}

// export class PreviewCommand implements ICommand {
// 	public allowedParameters: ICommandParameter[] = [];
//
// 	constructor(
// 		private $analyticsService: IAnalyticsService,
// 		private $errors: IErrors,
// 		private $logger: ILogger,
// 		private $migrateController: IMigrateController,
// 		private $previewAppController: IPreviewAppController,
// 		private $networkConnectivityValidator: INetworkConnectivityValidator,
// 		private $projectData: IProjectData,
// 		private $options: IOptions,
// 		private $previewAppLogProvider: IPreviewAppLogProvider,
// 		private $previewQrCodeService: IPreviewQrCodeService,
// 		$cleanupService: ICleanupService
// 	) {
// 		this.$analyticsService.setShouldDispose(false);
// 		$cleanupService.setShouldDispose(false);
// 	}
//
// 	public async execute(): Promise<void> {
// 		this.$previewAppLogProvider.on(
// 			DEVICE_LOG_EVENT_NAME,
// 			(deviceId: string, message: string) => {
// 				this.$logger.info(message);
// 			}
// 		);
//
// 		await this.$previewAppController.startPreview({
// 			projectDir: this.$projectData.projectDir,
// 			useHotModuleReload: this.$options.hmr,
// 			env: this.$options.env,
// 		});
//
// 		await this.$previewQrCodeService.printLiveSyncQrCode({
// 			projectDir: this.$projectData.projectDir,
// 			useHotModuleReload: this.$options.hmr,
// 			link: this.$options.link,
// 		});
// 	}
//
// 	public async canExecute(args: string[]): Promise<boolean> {
// 		if (args && args.length) {
// 			this.$errors.failWithHelp(
// 				`The ${args.length > 1 ? "arguments" : "argument"} '${args.join(
// 					" "
// 				)}' ${
// 					args.length > 1 ? "are" : "is"
// 				} not valid for the preview command.`
// 			);
// 		}
//
// 		if (!this.$options.force) {
// 			await this.$migrateController.validate({
// 				projectDir: this.$projectData.projectDir,
// 				platforms: [],
// 			});
// 		}
//
// 		await this.$networkConnectivityValidator.validate();
// 		return true;
// 	}
// }
injector.registerCommand("preview", PreviewCommand);
