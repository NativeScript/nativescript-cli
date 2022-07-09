import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IChildProcess, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import { IPackageManager } from "../declarations";
import { IProjectData } from "../definitions/project";
import path = require("path");
import { resolvePackagePath } from "@rigor789/resolve-package-path";

const PREVIEW_CLI_PACKAGE = "@nativescript/preview-cli";

export class PreviewCommand implements ICommand {
	allowedParameters: ICommandParameter[] = [];

	constructor(
		private $errors: IErrors,
		private $projectData: IProjectData,
		private $packageManager: IPackageManager,
		private $childProcess: IChildProcess
	) {}

	private getPreviewCLIPath(): string {
		return resolvePackagePath(PREVIEW_CLI_PACKAGE, {
			paths: [this.$projectData.projectDir],
		});
	}

	async execute(args: string[]): Promise<void> {
		await this.$packageManager.install(
			`${PREVIEW_CLI_PACKAGE}@exp`,
			this.$projectData.projectDir,
			{
				"save-dev": true,
				"save-exact": true,
			} as any
		);

		const previewCLIPath = this.getPreviewCLIPath();

		if (!previewCLIPath) {
			this.$errors.fail("No Preview CLI found.");
		}

		const previewCLIBinPath = path.resolve(previewCLIPath, "./dist/index.js");

		this.$childProcess.spawn(previewCLIBinPath, args, {
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
