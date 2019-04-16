import * as helpers from "../common/helpers";

abstract class TestCommandBase {
	public allowedParameters: ICommandParameter[] = [];
	private projectFilesConfig: IProjectFilesConfig;
	protected abstract platform: string;
	protected abstract $projectData: IProjectData;
	protected abstract $testExecutionService: ITestExecutionService;
	protected abstract $analyticsService: IAnalyticsService;
	protected abstract $options: IOptions;
	protected abstract $platformEnvironmentRequirements: IPlatformEnvironmentRequirements;
	protected abstract $errors: IErrors;
	protected abstract $cleanupService: ICleanupService;

	async execute(args: string[]): Promise<void> {
		await this.$testExecutionService.startKarmaServer(this.platform, this.$projectData, this.projectFilesConfig);
	}

	async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		this.$projectData.initializeProjectData();
		this.$analyticsService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);
		this.$cleanupService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);
		this.projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: this.$options.release });

		const output = await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
			platform: this.platform,
			projectDir: this.$projectData.projectDir,
			options: this.$options,
			notConfiguredEnvOptions: {
				hideSyncToPreviewAppOption: true,
				hideCloudBuildOption: true
			}
		});

		const canStartKarmaServer = await this.$testExecutionService.canStartKarmaServer(this.$projectData);
		if (!canStartKarmaServer) {
			this.$errors.fail({
				formatStr: "Error: In order to run unit tests, your project must already be configured by running $ tns test init.",
				suppressCommandHelp: true,
				errorCode: ErrorCodes.TESTS_INIT_REQUIRED
			});
		}

		return output.canExecute && canStartKarmaServer;
	}
}

class TestAndroidCommand extends TestCommandBase implements ICommand {
	protected platform = "android";

	constructor(protected $projectData: IProjectData,
		protected $testExecutionService: ITestExecutionService,
		protected $analyticsService: IAnalyticsService,
		protected $options: IOptions,
		protected $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		protected $errors: IErrors,
		protected $cleanupService: ICleanupService) {
		super();
	}

}

class TestIosCommand extends TestCommandBase implements ICommand {
	protected platform = "iOS";

	constructor(protected $projectData: IProjectData,
		protected $testExecutionService: ITestExecutionService,
		protected $analyticsService: IAnalyticsService,
		protected $options: IOptions,
		protected $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		protected $errors: IErrors,
		protected $cleanupService: ICleanupService) {
		super();
	}

}

$injector.registerCommand("test|android", TestAndroidCommand);
$injector.registerCommand("test|ios", TestIosCommand);
