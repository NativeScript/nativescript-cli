function RunTestCommandFactory(platform: string) {
	return function RunTestCommand($testExecutionService: ITestExecutionService) {
		this.execute = (args: string[]): IFuture<void> => $testExecutionService.startTestRunner(platform);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("dev-test|android",  RunTestCommandFactory('android'));
$injector.registerCommand("dev-test|ios",  RunTestCommandFactory('iOS'));

function RunKarmaTestCommandFactory(platform: string) {
	return function RunKarmaTestCommand($testExecutionService: ITestExecutionService) {
		this.execute = (args: string[]): IFuture<void> => $testExecutionService.startKarmaServer(platform);
		this.allowedParameters = [];
	};
}

$injector.registerCommand("test|android", RunKarmaTestCommandFactory('android'));
$injector.registerCommand("test|ios", RunKarmaTestCommandFactory('iOS'));
