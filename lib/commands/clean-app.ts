export class CleanAppCommandBase {
	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		private $platformService: IPlatformService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		let platform = args[0].toLowerCase();
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		return this.$platformService.cleanDestinationApp(platform, appFilesUpdaterOptions, this.$options.platformTemplate, this.$projectData, this.$options);
	}
}

export class CleanAppIosCommand extends CleanAppCommandBase implements ICommand {
	constructor(protected $options: IOptions,
		private $platformsData: IPlatformsData,
		$platformService: IPlatformService,
		$projectData: IProjectData) {
		super($options, $projectData, $platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		return super.execute([this.$platformsData.availablePlatforms.iOS]);
	}
}

$injector.registerCommand("clean-app|ios", CleanAppIosCommand);

export class CleanAppAndroidCommand extends CleanAppCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		private $platformsData: IPlatformsData,
		$platformService: IPlatformService,
		$projectData: IProjectData) {
		super($options, $projectData, $platformService);
	}

	public async execute(args: string[]): Promise<void> {
		return super.execute([this.$platformsData.availablePlatforms.Android]);
	}
}

$injector.registerCommand("clean-app|android", CleanAppAndroidCommand);
