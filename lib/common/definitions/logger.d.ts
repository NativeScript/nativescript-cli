import { Layout, LoggingEvent, Configuration, Level } from "log4js";
import { EventEmitter } from "events";
import { LoggerLevel } from "../../constants";

declare global {
	interface IAppenderOptions extends IDictionary<any> {
		type: string;
	}

	interface ILoggerOptions {
		level?: LoggerLevel;
		appenderOptions?: IAppenderOptions;
	}

	interface ILogger {
		initialize(opts?: ILoggerOptions): void;
		initializeCliLogger(): void;
		getLevel(): string;
		fatal(formatStr?: any, ...args: any[]): void;
		error(formatStr?: any, ...args: any[]): void;
		warn(formatStr?: any, ...args: any[]): void;
		info(formatStr?: any, ...args: any[]): void;
		debug(formatStr?: any, ...args: any[]): void;
		trace(formatStr?: any, ...args: any[]): void;
		printMarkdown(...args: any[]): void;
		prepare(item: any): string;
	}


	interface Log4JSEmitAppenderConfiguration extends Configuration {
		layout: Layout;
		emitter: EventEmitter;
	}
}
