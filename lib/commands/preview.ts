import { DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { PreviewAppController } from "../controllers/preview-app-controller";

export class PreviewCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	private static MIN_SUPPORTED_WEBPACK_VERSION = "0.17.0";

	constructor(private $analyticsService: IAnalyticsService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		private $errors: IErrors,
		private $logger: ILogger,
		private $previewAppController: PreviewAppController,
		private $networkConnectivityValidator: INetworkConnectivityValidator,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewQrCodeService: IPreviewQrCodeService,
		$cleanupService: ICleanupService) {
			this.$analyticsService.setShouldDispose(false);
			$cleanupService.setShouldDispose(false);
		}

	public async execute(): Promise<void> {
		this.$previewAppLogProvider.on(DEVICE_LOG_EVENT_NAME, (deviceId: string, message: string) => {
			this.$logger.info(message);
		});

		await this.$previewAppController.preview({
			projectDir: this.$projectData.projectDir,
			useHotModuleReload: this.$options.hmr,
			env: this.$options.env
		});

		await this.$previewQrCodeService.printLiveSyncQrCode({
			projectDir: this.$projectData.projectDir,
			useHotModuleReload: this.$options.hmr,
			link: this.$options.link
		});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args && args.length) {
			this.$errors.fail(`The arguments '${args.join(" ")}' are not valid for the preview command.`);
		}

		await this.$networkConnectivityValidator.validate();
		this.$bundleValidatorHelper.validate(PreviewCommand.MIN_SUPPORTED_WEBPACK_VERSION);
		return true;
	}
}
$injector.registerCommand("preview", PreviewCommand);
