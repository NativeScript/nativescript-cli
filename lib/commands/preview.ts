import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IErrors } from "../common/declarations";
import { injector } from "../common/yok";

export class PreviewCommand implements ICommand {
	allowedParameters: ICommandParameter[] = [];

	constructor(private $errors: IErrors) {}

	async execute(args: string[]): Promise<void> {
		this.$errors.fail(
			`The Preview service has been disabled until further notice.\n\n` +
				`Configure local builds and use "ns run ${args.join(" ")}" instead.`
		);
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
