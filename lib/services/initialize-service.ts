import { EOL } from "os";
import { LoggerLevel } from "../constants";

export class InitializeService implements IInitializeService {
	// NOTE: Do not inject anything here, use $injector.resolve in the code
	// Injecting something may lead to logger initialization, but we want to initialize it from here.
	constructor(private $injector: IInjector) { }

	public async initialize(initOpts?: IInitializeOptions): Promise<void> {
		initOpts = initOpts || {};
		const $logger = this.$injector.resolve<ILogger>("logger");
		console.time("init 1");
		if (initOpts.loggerOptions) {
			$logger.initialize(initOpts.loggerOptions);
		} else {
			const $options = this.$injector.resolve<IOptions>("options");
			const loggerLevel = $options.log && LoggerLevel[$options.log.toUpperCase() as keyof typeof LoggerLevel];
			$logger.initializeCliLogger({ level: loggerLevel });
		}
		console.timeEnd("init 1");

		console.time("init 2");
		if (initOpts.settingsServiceOptions) {
			const $settingsService = this.$injector.resolve<ISettingsService>("settingsService");
			$settingsService.setSettings(initOpts.settingsServiceOptions);
		}
		console.timeEnd("init 2");

		console.time("init 3");
		if (initOpts.extensibilityOptions) {
			if (initOpts.extensibilityOptions.pathToExtensions) {
				const $extensibilityService = this.$injector.resolve<IExtensibilityService>("extensibilityService");
				$extensibilityService.pathToExtensions = initOpts.extensibilityOptions.pathToExtensions;
			}
		}
		console.timeEnd("init 3");

		console.time("init 4");
		await this.showWarnings($logger);
		console.timeEnd("init 4");
	}

	private async showWarnings($logger: ILogger): Promise<void> {
		const $sysInfo = $injector.resolve<ISysInfo>("sysInfo");
		console.time("sys warnings");
		const systemWarnings = await $sysInfo.getSystemWarnings();
		console.timeEnd("sys warnings");
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
