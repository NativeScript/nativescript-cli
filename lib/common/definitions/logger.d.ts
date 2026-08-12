import { Layout, LoggingEvent, Configuration, Level } from "log4js";
import { EventEmitter } from "events";
import { LoggerLevel } from "../../constants";
import { IDictionary } from "../declarations";
import type { Logger } from "../../contracts/logger";

declare global {
	interface IAppenderOptions extends IDictionary<any> {
		type: string;
		layout?: Layout;
	}

	interface ILoggerOptions {
		level?: LoggerLevel;
		appenderOptions?: IAppenderOptions;
	}

	interface ILogger extends Logger {}

	interface Log4JSAppenderConfiguration extends Configuration {
		layout: Layout;
	}

	interface Log4JSEmitAppenderConfiguration extends Log4JSAppenderConfiguration {
		emitter: EventEmitter;
	}
}
