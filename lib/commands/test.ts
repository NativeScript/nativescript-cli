import * as helpers from "../common/helpers";

function RunTestCommandFactory(platform: string) {
	return function RunTestCommand(
		$options: IOptions,
		$testExecutionService: ITestExecutionService,
		$projectData: IProjectData) {
		$projectData.initializeProjectData();
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startTestRunner(platform, $projectData, projectFilesConfig);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("dev-test|android", RunTestCommandFactory('android'));
$injector.registerCommand("dev-test|ios", RunTestCommandFactory('iOS'));

function RunKarmaTestCommandFactory(platform: string) {
	return function RunKarmaTestCommand($options: IOptions, $testExecutionService: ITestExecutionService, $projectData: IProjectData) {
		$projectData.initializeProjectData();
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startKarmaServer(platform, $projectData, projectFilesConfig);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("test|android", RunKarmaTestCommandFactory('android'));
$injector.registerCommand("test|ios", RunKarmaTestCommandFactory('iOS'));
