import { Layout, LoggingEvent, Configuration, Level } from "log4js";
import { EventEmitter } from "events";
import { LoggerLevel } from "../../constants";

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

		/**
		 * DEPRECATED
		 * Do not use it.
		 */
		out(formatStr?: any, ...args: any[]): void;

		/**
		 * DEPRECATED
		 * Do not use it.
		 */
		write(...args: any[]): void;

		/**
		 * DEPRECATED
		 * Do not use it.
		 */
		printInfoMessageOnSameLine(message: string): void;

		/**
		 * DEPRECATED
		 * Do not use it.
		 */
		printMsgWithTimeout(message: string, timeout: number): Promise<void>;

		/**
		 * DEPRECATED
		 * Do not use it.
		 */
		printOnStderr(formatStr?: any, ...args: any[]): void;
	}

	interface Log4JSAppenderConfiguration extends Configuration {
		layout: Layout;
	}

	interface Log4JSEmitAppenderConfiguration extends Log4JSAppenderConfiguration {
		emitter: EventEmitter;
	}
}
