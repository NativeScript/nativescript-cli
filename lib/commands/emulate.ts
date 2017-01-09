export class EmulateCommandBase {
	constructor(private $platformService: IPlatformService) { }

	public async executeCore(args: string[]): Promise<void> {
		return this.$platformService.emulatePlatform(args[0]);
	}
}

export class EmulateIosCommand extends EmulateCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}
}

$injector.registerCommand("emulate|ios", EmulateIosCommand);

export class EmulateAndroidCommand extends EmulateCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}
}

$injector.registerCommand("emulate|android", EmulateAndroidCommand);
