export class CleanAppCommandBase {
	constructor(protected $options: IOptions,
		private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		let platform = args[0].toLowerCase();
		return this.$platformService.cleanDestinationApp(platform);
	}
}

export class CleanAppIosCommand extends CleanAppCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				private $platformsData: IPlatformsData,
				$platformService: IPlatformService) {
		super($options, $platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return super.execute([this.$platformsData.availablePlatforms.iOS]);
	}
}
$injector.registerCommand("clean-app|ios", CleanAppIosCommand);

export class CleanAppAndroidCommand extends CleanAppCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				private $platformsData: IPlatformsData,
				private $errors: IErrors,
				$platformService: IPlatformService) {
		super($options, $platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return super.execute([this.$platformsData.availablePlatforms.Android]);
	}
}
$injector.registerCommand("clean-app|android", CleanAppAndroidCommand);
