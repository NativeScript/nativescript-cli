import { EOL } from "os";
import * as _ from "lodash";
import { LoggerLevel } from "../constants";
import { IOptions } from "../declarations";
import { ISettingsService, ISysInfo } from "../common/declarations";
import {
	IInitializeOptions,
	IInitializeService,
} from "../definitions/initialize-service";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { IExtensibilityService } from "../common/definitions/extensibility";

export class InitializeService implements IInitializeService {
	// NOTE: Do not inject anything here, use $injector.resolve in the code
	// Injecting something may lead to logger initialization, but we want to initialize it from here.
	constructor(private $injector: IInjector) {}

	public async initialize(initOpts?: IInitializeOptions): Promise<void> {
		initOpts = initOpts || {};
		const $logger = this.$injector.resolve<ILogger>("logger");
		if (initOpts.loggerOptions) {
			$logger.initialize(initOpts.loggerOptions);
		} else {
			const $options = this.$injector.resolve<IOptions>("options");
			const loggerLevel =
				$options.log &&
				LoggerLevel[$options.log.toUpperCase() as keyof typeof LoggerLevel];
			$logger.initializeCliLogger({ level: loggerLevel });
		}

		if (initOpts.settingsServiceOptions) {
			const $settingsService = this.$injector.resolve<ISettingsService>(
				"settingsService"
			);
			$settingsService.setSettings(initOpts.settingsServiceOptions);
		}

		if (initOpts.extensibilityOptions) {
			if (initOpts.extensibilityOptions.pathToExtensions) {
				const $extensibilityService = this.$injector.resolve<
					IExtensibilityService
				>("extensibilityService");
				$extensibilityService.pathToExtensions =
					initOpts.extensibilityOptions.pathToExtensions;
			}
		}

		await this.showWarnings($logger);
	}

	private async showWarnings($logger: ILogger): Promise<void> {
		const $sysInfo = injector.resolve<ISysInfo>("sysInfo");
		const systemWarnings = await $sysInfo.getSystemWarnings();
		_.each(systemWarnings, (systemWarning) => {
			const message = `${EOL}${systemWarning.message}${EOL}`;
			if (systemWarning.severity === SystemWarningsSeverity.high) {
				$logger.error(message);
			} else {
				$logger.warn(message);
			}
		});
	}
}

injector.register("initializeService", InitializeService);
