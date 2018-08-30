import { CommandBase } from "./command-base";

export class CleanAppCommandBase extends CommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	protected platform: string;

	constructor($options: IOptions,
		$projectData: IProjectData,
		$platformService: IPlatformService,
		protected $errors: IErrors,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$platformsData: IPlatformsData) {
			super($options, $platformsData, $platformService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
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
