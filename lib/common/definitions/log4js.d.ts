declare module "log4js" {
	interface ILogger {
		fatal(formatStr: string, ...args: string[]): void;
		error(formatStr: string, ...args: string[]): void;
		warn(formatStr: string, ...args: string[]): void;
		info(formatStr: string, ...args: string[]): void;
		debug(formatStr: string, ...args: string[]): void;
		trace(formatStr: string, ...args: string[]): void;

		setLevel(level: string): void;
		level: any;
	}

	interface IConfiguration {
		appenders: IAppender[];
	}

	interface IAppender {
		type: string;
		layout: ILayout;
	}

	interface ILayout {
		type: string;
	}

	function configure(conf: IConfiguration): void;
	function getLogger(categoryName?: string): ILogger;

	export class Level {
		isEqualTo(level: any): boolean;
		isLessThanOrEqualTo(level: any): boolean;
		isGreaterThanOrEqualTo(level: any): boolean;
	}

	export namespace levels {
		var ALL: Level;
		var TRACE: Level;
		var DEBUG: Level;
		var INFO: Level;
		var WARN: Level;
		var ERROR: Level;
		var FATAL: Level;
		var MARK: Level;
		var OFF: Level;
	}
}
