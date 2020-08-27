import { DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { IProjectData } from "../definitions/project";
import { IMigrateController } from "../definitions/migrate";
import { INetworkConnectivityValidator, IOptions } from "../declarations";
import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IAnalyticsService, IErrors } from "../common/declarations";
import { ICleanupService } from "../definitions/cleanup-service";
import { injector } from "../common/yok";

export class PreviewCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $analyticsService: IAnalyticsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $migrateController: IMigrateController,
		private $previewAppController: IPreviewAppController,
		private $networkConnectivityValidator: INetworkConnectivityValidator,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewQrCodeService: IPreviewQrCodeService,
		$cleanupService: ICleanupService,
		private $markingModeService: IMarkingModeService
	) {
		this.$analyticsService.setShouldDispose(false);
		$cleanupService.setShouldDispose(false);
	}

	public async execute(): Promise<void> {
		await this.$markingModeService.handleMarkingModeFullDeprecation({
			projectDir: this.$projectData.projectDir,
			skipWarnings: true,
		});
		this.$previewAppLogProvider.on(
			DEVICE_LOG_EVENT_NAME,
			(deviceId: string, message: string) => {
				this.$logger.info(message);
			}
		);

		await this.$previewAppController.startPreview({
			projectDir: this.$projectData.projectDir,
			useHotModuleReload: this.$options.hmr,
			env: this.$options.env,
		});

		await this.$previewQrCodeService.printLiveSyncQrCode({
			projectDir: this.$projectData.projectDir,
			useHotModuleReload: this.$options.hmr,
			link: this.$options.link,
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args && args.length) {
			this.$errors.failWithHelp(
				`The ${args.length > 1 ? "arguments" : "argument"} '${args.join(
					" "
				)}' ${
					args.length > 1 ? "are" : "is"
				} not valid for the preview command.`
			);
		}

		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [],
			});
		}

		await this.$networkConnectivityValidator.validate();
		return true;
	}
}
injector.registerCommand("preview", PreviewCommand);
