function RunTestCommandFactory(platform: string) {
	return function RunTestCommand(
		$testExecutionService: ITestExecutionService,
		$projectData: IProjectData) {
		$projectData.initializeProjectData();
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startTestRunner(platform, $projectData);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("dev-test|android", RunTestCommandFactory('android'));
$injector.registerCommand("dev-test|ios", RunTestCommandFactory('iOS'));

function RunKarmaTestCommandFactory(platform: string) {
	return function RunKarmaTestCommand($testExecutionService: ITestExecutionService, $projectData: IProjectData) {
		$projectData.initializeProjectData();
		this.execute = (args: string[]): Promise<void> => $testExecutionService.startKarmaServer(platform, $projectData);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("test|android", RunKarmaTestCommandFactory('android'));
$injector.registerCommand("test|ios", RunKarmaTestCommandFactory('iOS'));
