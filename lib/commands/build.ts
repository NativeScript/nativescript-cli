export class BuildCommandBase {
	constructor(protected $options: IOptions,
		protected $projectData: IProjectData,
		protected $platformsData: IPlatformsData,
		protected $platformService: IPlatformService) {
			this.$projectData.initializeProjectData();
		}

	public async executeCore(args: string[]): Promise<void> {
		let platform = args[0].toLowerCase();
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		await this.$platformService.preparePlatform(platform, appFilesUpdaterOptions, this.$options.platformTemplate, this.$projectData, this.$options.provision);
		this.$options.clean = true;
		const buildConfig: IiOSBuildConfig = {
			buildForDevice: this.$options.forDevice,
			projectDir: this.$options.path,
			clean: this.$options.clean,
			teamId: this.$options.teamId,
			device: this.$options.device,
			provision: this.$options.provision,
			release: this.$options.release,
			keyStoreAlias: this.$options.keyStoreAlias,
			keyStorePath: this.$options.keyStorePath,
			keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
			keyStorePassword: this.$options.keyStorePassword
		};
		await this.$platformService.buildPlatform(platform, buildConfig, this.$projectData);
		if (this.$options.copyTo) {
			this.$platformService.copyLastOutput(platform, this.$options.copyTo, { isForDevice: this.$options.forDevice }, this.$projectData);
		}
	}
}

export class BuildIosCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		$platformService: IPlatformService) {
		super($options, $projectData, $platformsData, $platformService);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public canExecute(args: string[]): Promise<boolean> {
		return args.length === 0 && this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
	}
}

$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildAndroidCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		private $errors: IErrors,
		$platformService: IPlatformService) {
		super($options, $projectData, $platformsData, $platformService);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
		}
		return args.length === 0 && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("build|android", BuildAndroidCommand);
