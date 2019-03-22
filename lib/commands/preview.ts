import { DEVICE_LOG_EVENT_NAME } from "../common/constants";

export class PreviewCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	private static MIN_SUPPORTED_WEBPACK_VERSION = "0.17.0";

	constructor(private $analyticsService: IAnalyticsService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		private $errors: IErrors,
		private $liveSyncService: ILiveSyncService,
		private $logger: ILogger,
		private $networkConnectivityValidator: INetworkConnectivityValidator,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewQrCodeService: IPreviewQrCodeService) {
			this.$analyticsService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);
		}

	public async execute(): Promise<void> {
		this.$previewAppLogProvider.on(DEVICE_LOG_EVENT_NAME, (deviceId: string, message: string) => {
			this.$logger.info(message);
		});

		await this.$liveSyncService.liveSyncToPreviewApp({
			bundle: !!this.$options.bundle,
			useHotModuleReload: this.$options.hmr,
			projectDir: this.$projectData.projectDir,
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
