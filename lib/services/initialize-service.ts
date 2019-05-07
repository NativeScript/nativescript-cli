import { EOL } from "os";

export class InitializeService implements IInitializeService {
	// NOTE: Do not inject anything here, use $injector.resolve in the code
	// Injecting something may lead to logger initialization, but we want to initialize it from here.
	constructor(private $injector: IInjector) { }

	public async initialize(initOpts?: { loggerOptions?: ILoggerOptions }): Promise<void> {
		initOpts = initOpts || {};
		const $logger = this.$injector.resolve<ILogger>("logger");
		if (initOpts.loggerOptions) {
			$logger.initialize(initOpts.loggerOptions);
		} else {
			$logger.initializeCliLogger();
		}

		await this.showWarnings($logger);
	}

	private async showWarnings($logger: ILogger): Promise<void> {
		const $sysInfo = $injector.resolve<ISysInfo>("sysInfo");
		const systemWarnings = await $sysInfo.getSystemWarnings();
		_.each(systemWarnings, systemWarning => {
			const message = `${EOL}${systemWarning.message}${EOL}`;
			if (systemWarning.severity === SystemWarningsSeverity.high) {
				$logger.error(message);
			} else {
				$logger.warn(message);
			}
		});
	}
}

$injector.register("initializeService", InitializeService);
