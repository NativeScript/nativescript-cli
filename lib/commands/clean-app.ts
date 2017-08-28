export class CleanAppCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	protected platform: string;

	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		protected $platformService: IPlatformService,
		protected $errors: IErrors,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $platformsData: IPlatformsData) {

		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		return this.$platformService.cleanDestinationApp(this.platform.toLowerCase(), appFilesUpdaterOptions, this.$options.platformTemplate, this.$projectData, this.$options);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.platform, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.platform} can not be built on this OS`);
		}

		const platformData = this.$platformsData.getPlatformData(this.platform, this.$projectData);
		const platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate(this.$projectData);
		return true;
	}
}

export class CleanAppIosCommand extends CleanAppCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $platformsData: IPlatformsData,
		protected $errors: IErrors,
		$platformService: IPlatformService,
		$projectData: IProjectData) {
		super($options, $projectData, $platformService, $errors, $devicePlatformsConstants, $platformsData);
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
		$projectData: IProjectData) {
		super($options, $projectData, $platformService, $errors, $devicePlatformsConstants, $platformsData);
	}

	protected get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}
}

$injector.registerCommand("clean-app|android", CleanAppAndroidCommand);
