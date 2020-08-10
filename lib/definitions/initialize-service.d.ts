import { IConfigurationSettings } from "../common/declarations";

interface IInitializeOptions {
	loggerOptions?: ILoggerOptions;
	settingsServiceOptions?: IConfigurationSettings;
	extensibilityOptions?: { pathToExtensions: string };
}

interface IInitializeService {
	initialize(initOpts?: IInitializeOptions): Promise<void>;
}
