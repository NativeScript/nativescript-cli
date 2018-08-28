import * as helpers from "../common/helpers";

function RunTestCommandFactory(platform: string) {
	return function RunTestCommand(
		$options: IOptions,
		$testExecutionService: ITestExecutionService,
		$projectData: IProjectData,
		$analyticsService: IAnalyticsService,
		$platformEnvironmentRequirements: IPlatformEnvironmentRequirements) {
		$projectData.initializeProjectData();
		$analyticsService.setShouldDispose($options.justlaunch || !$options.watch);
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startTestRunner(platform, $projectData, projectFilesConfig);
		this.canExecute = (args: string[]): Promise<boolean> => canExecute({ $platformEnvironmentRequirements, $projectData, $options, platform });
		this.allowedParameters = [];
	};
}

$injector.registerCommand("dev-test|android", RunTestCommandFactory('android'));
$injector.registerCommand("dev-test|ios", RunTestCommandFactory('iOS'));

function RunKarmaTestCommandFactory(platform: string) {
	return function RunKarmaTestCommand($options: IOptions, $testExecutionService: ITestExecutionService, $projectData: IProjectData, $analyticsService: IAnalyticsService, $platformEnvironmentRequirements: IPlatformEnvironmentRequirements) {
		$projectData.initializeProjectData();
		$analyticsService.setShouldDispose($options.justlaunch || !$options.watch);
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startKarmaServer(platform, $projectData, projectFilesConfig);
		this.canExecute = (args: string[]): Promise<boolean> => canExecute({ $platformEnvironmentRequirements, $projectData, $options, platform });
		this.allowedParameters = [];
	};
}

async function canExecute(input: { $platformEnvironmentRequirements: IPlatformEnvironmentRequirements, $projectData: IProjectData, $options: IOptions, platform: string }): Promise<boolean> {
	const { $platformEnvironmentRequirements, $projectData, $options, platform } = input;
	const output = await $platformEnvironmentRequirements.checkEnvironmentRequirements({
		platform,
		projectDir: $projectData.projectDir,
		options: $options,
		hideSyncToPreviewAppOption: true
	});

	return output.canExecute;
}

$injector.registerCommand("test|android", RunKarmaTestCommandFactory('android'));
$injector.registerCommand("test|ios", RunKarmaTestCommandFactory('iOS'));
