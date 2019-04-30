import { ValidatePlatformCommandBase } from "./command-base";

export class CleanAppCommandBase extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	protected platform: string;

	constructor($options: IOptions,
		$projectData: IProjectData,
		$platformService: IPlatformService,
		protected $errors: IErrors,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$platformsData: IPlatformsData,
		private $logger: ILogger) {
			super($options, $platformsData, $platformService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		this.$logger.warn(`"tns clean-app ${this.platform.toLowerCase()}" command has been deprecated and will be removed in the upcoming NativeScript CLI v.6.0.0. More info can be found in this issue https://github.com/NativeScript/nativescript-cli/issues/4518.`);

		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
			bundle: !!this.$options.bundle,
			release: this.$options.release,
			useHotModuleReload: false
		};
		const platformInfo: IPreparePlatformInfo = {
			appFilesUpdaterOptions,
			platform: this.platform.toLowerCase(),
			config: this.$options,
			platformTemplate: this.$options.platformTemplate,
			projectData: this.$projectData,
			env: this.$options.env
		};

		return this.$platformService.cleanDestinationApp(platformInfo);
	}

	public async canExecute(args: string[]): Promise<ICanExecuteCommandOutput> {
		if (!this.$platformService.isPlatformSupportedForOS(this.platform, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.platform} can not be built on this OS`);
		}

		const result = await super.canExecuteCommandBase(this.platform);
		return result;
	}
}

export class CleanAppIosCommand extends CleanAppCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $platformsData: IPlatformsData,
		protected $errors: IErrors,
		$platformService: IPlatformService,
		$projectData: IProjectData,
		$logger: ILogger) {
		super($options, $projectData, $platformService, $errors, $devicePlatformsConstants, $platformsData, $logger);
	}

	protected get platform(): string {
		return this.$devicePlatformsConstants.iOS;
	}
}

$injector.registerCommand("clean-app|ios", CleanAppIosCommand);

export class CleanAppAndroidCommand extends CleanAppCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $platformsData: IPlatformsData,
		protected $errors: IErrors,
		$platformService: IPlatformService,
		$projectData: IProjectData,
		$logger: ILogger) {
		super($options, $projectData, $platformService, $errors, $devicePlatformsConstants, $platformsData, $logger);
	}

	protected get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}
}

$injector.registerCommand("clean-app|android", CleanAppAndroidCommand);
