import { Layout, LoggingEvent, Configuration, Level } from "log4js";
import { EventEmitter } from "events";
import { LoggerLevel } from "../../constants";
import { IDictionary } from "../declarations";

declare global {
	interface IAppenderOptions extends IDictionary<any> {
		type: string;
		layout?: Layout;
	}

	interface ILoggerOptions {
		level?: LoggerLevel;
		appenderOptions?: IAppenderOptions;
	}

	interface ILogger {
		initialize(opts?: ILoggerOptions): void;
		initializeCliLogger(opts?: ILoggerOptions): void;
		getLevel(): string;
		fatal(formatStr?: any, ...args: any[]): void;
		error(formatStr?: any, ...args: any[]): void;
		warn(formatStr?: any, ...args: any[]): void;
		info(formatStr?: any, ...args: any[]): void;
		debug(formatStr?: any, ...args: any[]): void;
		trace(formatStr?: any, ...args: any[]): void;
		printMarkdown(...args: any[]): void;
		prepare(item: any): string;
		isVerbose(): boolean;
	}

	interface Log4JSAppenderConfiguration extends Configuration {
		layout: Layout;
	}

	interface Log4JSEmitAppenderConfiguration
		extends Log4JSAppenderConfiguration {
		emitter: EventEmitter;
	}
}
