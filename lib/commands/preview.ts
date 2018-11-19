import { DEVICE_LOG_EVENT_NAME } from "../common/constants";

export class PreviewCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	private static MIN_SUPPORTED_WEBPACK_VERSION = "0.17.0";

	constructor(private $bundleValidatorHelper: IBundleValidatorHelper,
		private $errors: IErrors,
		private $liveSyncService: ILiveSyncService,
		private $logger: ILogger,
		private $networkConnectivityValidator: INetworkConnectivityValidator,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewQrCodeService: IPreviewQrCodeService) { }

	public async execute(): Promise<void> {
		this.$previewAppLogProvider.on(DEVICE_LOG_EVENT_NAME, (deviceId: string, message: string) => {
			this.$logger.info(message);
		});

		await this.$liveSyncService.liveSync([], {
			syncToPreviewApp: true,
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean,
			bundle: !!this.$options.bundle,
			release: this.$options.release,
			env: this.$options.env,
			timeout: this.$options.timeout,
			useHotModuleReload: this.$options.hmr
		});

		await this.$previewQrCodeService.printLiveSyncQrCode({ useHotModuleReload: this.$options.hmr, link: this.$options.link });
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
