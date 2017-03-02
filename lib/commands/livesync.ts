export class LivesyncCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $usbLiveSyncService: ILiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		if (!this.$options.help && args[0]) {
			this.$logger.warn('This command is deprecated. It will be removed in the next version of NativeScript CLI. Use "$ tns run" command instead.');
		}

		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		const deployOptions: IDeployPlatformOptions = {
			clean: this.$options.clean,
			device: this.$options.device,
			emulator: this.$options.emulator,
			projectDir: this.$options.path,
			platformTemplate: this.$options.platformTemplate,
			release: this.$options.release
		};

		await this.$platformService.deployPlatform(args[0], appFilesUpdaterOptions, deployOptions, this.$projectData, this.$options.provision);
		return this.$usbLiveSyncService.liveSync(args[0], this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length >= 2) {
			this.$errors.fail("Invalid number of arguments.");
		}

		let platform = args[0];
		if (platform) {
			return _.includes(this.$mobileHelper.platformNames, this.$mobileHelper.normalizePlatformName(platform)) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, args[0]);
		} else {
			return await this.$platformService.validateOptions(this.$options.provision, this.$projectData);
		}
	}
}

$injector.registerCommand("livesync", LivesyncCommand);
