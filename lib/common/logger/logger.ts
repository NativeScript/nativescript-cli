import * as log4js from "log4js";
import * as util from "util";
import * as stream from "stream";
import * as marked from "marked";
import { cache } from "../decorators";
import { layout } from "./layouts/cli-layout";
import { LoggerConfigData, LoggerLevel, LoggerAppenders } from "../../constants";
const TerminalRenderer = require("marked-terminal");
const chalk = require("chalk");

export class Logger implements ILogger {
	private log4jsLogger: log4js.Logger = null;
	private passwordRegex = /(password=).*?(['&,]|$)|(password["']?\s*:\s*["']).*?(["'])/i;
	private passwordReplacement = "$1$3*******$2$4";

	constructor(private $config: Config.IConfig,
		private $options: IOptions) {
	}

	@cache()
	public initialize(opts?: ILoggerOptions): void {
		opts = opts || {};
		const { appenderOptions: appenderOpts, level } = opts;

		const appender: any = {
			type: "console",
			layout: {
				type: "messagePassThrough"
			}
		};

		if (appenderOpts) {
			_.merge(appender, appenderOpts);
		}

		const appenders: IDictionary<log4js.Appender> = {
			out: appender
		};

		const categories: IDictionary<{ appenders: string[]; level: string; }> = {
			default: {
				appenders: ['out'],
				level: level || (this.$config.DEBUG ? "TRACE" : "INFO")
			}
		};

		log4js.configure({ appenders, categories });

		this.log4jsLogger = log4js.getLogger();
	}

	public initializeCliLogger(): void {
		log4js.addLayout("cli", layout);

		this.initialize({
			appenderOptions: { type: LoggerAppenders.cliAppender, layout: { type: "cli" } },
			level: <any>this.$options.log
		});
	}

	getLevel(): string {
		this.initialize();

		return this.log4jsLogger.level.toString();
	}

	fatal(...args: any[]): void {
		this.logMessage(args, LoggerLevel.FATAL);
	}

	error(...args: any[]): void {
		args.push({ [LoggerConfigData.useStderr]: true });
		this.logMessage(args, LoggerLevel.ERROR);
	}

	warn(...args: any[]): void {
		this.logMessage(args, LoggerLevel.WARN);
	}

	info(...args: any[]): void {
		this.logMessage(args, LoggerLevel.INFO);
	}

	debug(...args: any[]): void {
		const encodedArgs: string[] = this.getPasswordEncodedArguments(args);
		this.logMessage(encodedArgs, LoggerLevel.DEBUG);
	}

	trace(...args: any[]): void {
		const encodedArgs: string[] = this.getPasswordEncodedArguments(args);
		this.logMessage(encodedArgs, LoggerLevel.TRACE);
	}

	prepare(item: any): string {
		if (typeof item === "undefined" || item === null) {
			return "[no content]";
		}
		if (typeof item === "string") {
			return item;
		}
		// do not try to read streams, because they may not be rewindable
		if (item instanceof stream.Readable) {
			return "[ReadableStream]";
		}

		// There's no point in printing buffers
		if (item instanceof Buffer) {
			return "[Buffer]";
		}

		return JSON.stringify(item);
	}

	public printMarkdown(...args: string[]): void {
		const opts = {
			unescape: true,
			link: chalk.red,
			strong: chalk.green.bold,
			firstHeading: chalk.blue.bold,
			tableOptions: {
				chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
				style: {
					'padding-left': 1,
					'padding-right': 1,
					head: ['green', 'bold'],
					border: ['grey'],
					compact: false
				}
			}
		};

		marked.setOptions({ renderer: new TerminalRenderer(opts) });

		const formattedMessage = marked(util.format.apply(null, args));
		this.info(formattedMessage, { [LoggerConfigData.skipNewLine]: true });
	}

	private logMessage(inputData: any[], logMethod: string): void {
		this.initialize();

		const logOpts = this.getLogOptionsForMessage(inputData);
		const data = logOpts.data;
		delete logOpts.data;

		for (const prop in logOpts) {
			this.log4jsLogger.addContext(prop, logOpts[prop]);
		}

		(<IDictionary<any>>this.log4jsLogger)[logMethod.toLowerCase()].apply(this.log4jsLogger, data);

		for (const prop in logOpts) {
			this.log4jsLogger.removeContext(prop);
		}
	}

	private getLogOptionsForMessage(data: any[]): { data: any[], [key: string]: any } {
		const opts = _.keys(LoggerConfigData);

		const result: any = {};
		const cleanedData = _.cloneDeep(data);

		// objects created with Object.create(null) do not have `hasOwnProperty` function
		const dataToCheck = data.filter(el => typeof el === "object" && el.hasOwnProperty && typeof el.hasOwnProperty === "function");

		for (const element of dataToCheck) {
			if (opts.length === 0) {
				break;
			}

			const remainingOpts = _.cloneDeep(opts);
			for (const prop of remainingOpts) {
				const hasProp = element && element.hasOwnProperty(prop);
				if (hasProp) {
					opts.splice(opts.indexOf(prop), 1);
					result[prop] = element[prop];
					cleanedData.splice(cleanedData.indexOf(element), 1);
				}
			}
		}

		result.data = cleanedData;
		return result;
	}

	private getPasswordEncodedArguments(args: string[]): string[] {
		return _.map(args, argument => {
			if (typeof argument === 'string' && !!argument.match(/password/i)) {
				argument = argument.replace(this.passwordRegex, this.passwordReplacement);
			}

			return argument;
		});
	}

	/*******************************************************************************************
	 * Metods below are deprecated. Delete them in 6.0.0 release:                              *
	 * Present only for backwards compatibility as some plugins (nativescript-plugin-firebase) *
	 * use these methods in their hooks                                                          *
	 *******************************************************************************************/

	out(...args: any[]): void {
		this.info(...args);
	}

	write(...args: any[]): void {
		this.info(...args, { [LoggerConfigData.skipNewLine]: true });
	}

	printOnStderr(...args: string[]): void {
		this.error(...args);
	}

	printInfoMessageOnSameLine(message: string): void {
		this.info(message, { [LoggerConfigData.skipNewLine]: true });
	}

	printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			setTimeout(() => {
				this.printInfoMessageOnSameLine(message);
				resolve();
			}, timeout);
		});
	}
}

$injector.register("logger", Logger);
