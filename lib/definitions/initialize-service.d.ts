interface IInitializeService {
	initialize(initOpts?: { loggerOptions?: ILoggerOptions }): Promise<void>;
}
