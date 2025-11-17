import * as log4js from "log4js";
import * as util from "util";
import * as readline from "readline";
import * as stream from "stream";
import { marked } from "marked";
import * as _ from "lodash";
import { cache } from "../decorators";
import { layout } from "./layouts/cli-layout";
import {
	LoggerConfigData,
	LoggerLevel,
	LoggerAppenders,
} from "../../constants";
import { IDictionary } from "../declarations";
import { injector } from "../yok";
import { color } from "../../color";
import { markedTerminal } from "marked-terminal";

export class Logger implements ILogger {
	private log4jsLogger: log4js.Logger = null;
	private passwordRegex =
		/(password=).*?(['&,]|$)|(password["']?\s*:\s*["']).*?(["'])/i;
	private passwordReplacement = "$1$3*******$2$4";
	private defaultLogLevel: LoggerLevel;

	constructor(private $config: Config.IConfig) {
		this.defaultLogLevel = this.$config.DEBUG
			? LoggerLevel.TRACE
			: LoggerLevel.INFO;
	}

	@cache()
	public initialize(opts?: ILoggerOptions): void {
		opts = opts || {};
		const { appenderOptions: appenderOpts, level } = opts;

		const appender: any = {
			type: "console",
			layout: {
				type: "messagePassThrough",
			},
		};

		if (appenderOpts) {
			_.merge(appender, appenderOpts);
		}

		const appenders: IDictionary<log4js.Appender> = {
			out: appender,
		};

		const categories: IDictionary<{ appenders: string[]; level: string }> = {
			default: {
				appenders: ["out"],
				level: level || this.defaultLogLevel,
			},
		};

		log4js.configure({ appenders, categories });

		this.log4jsLogger = log4js.getLogger();
		if (level === LoggerLevel.TRACE || level === LoggerLevel.ALL) {
			this.warn(
				`The "${level}" log level might print some sensitive data like secrets or access tokens in request URLs. Be careful when you share this output.`,
				{ wrapMessageWithBorders: true },
			);
		}
	}

	public initializeCliLogger(opts?: ILoggerOptions): void {
		log4js.addLayout("cli", layout);

		this.initialize({
			appenderOptions: {
				type: LoggerAppenders.cliAppender,
				layout: { type: "cli" },
			},
			level: opts.level || this.defaultLogLevel,
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
			link: color.red,
			strong: (str: string) => color.styleText(["green", "bold"], str),
			firstHeading: (str: string) => color.styleText(["blue", "bold"], str),
			tableOptions: {
				chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
				style: {
					"padding-left": 1,
					"padding-right": 1,
					head: ["green", "bold"],
					border: ["grey"],
					compact: false,
				},
			},
		};

		marked.use(markedTerminal(opts) as any);

		const formattedMessage = marked.parse(util.format.apply(null, args));
		this.info(formattedMessage, { [LoggerConfigData.skipNewLine]: true });
	}

	public isVerbose(): boolean {
		return log4js.levels.DEBUG.isGreaterThanOrEqualTo(this.getLevel());
	}

	public clearScreen() {
		const repeatCount = process.stdout.rows - 2;
		const blank = repeatCount > 0 ? "\n".repeat(repeatCount) : "";
		console.log(blank);
		readline.cursorTo(process.stdout, 0, 0);
		readline.clearScreenDown(process.stdout);
	}

	private logMessage(inputData: any[], logMethod: string): void {
		this.initialize();

		const logOpts = this.getLogOptionsForMessage(inputData);
		const data = logOpts.data;
		delete logOpts.data;

		for (const prop in logOpts) {
			this.log4jsLogger.addContext(prop, logOpts[prop]);
		}

		(<IDictionary<any>>this.log4jsLogger)[logMethod.toLowerCase()].apply(
			this.log4jsLogger,
			data,
		);

		for (const prop in logOpts) {
			this.log4jsLogger.removeContext(prop);
		}
	}

	private getLogOptionsForMessage(data: any[]): {
		data: any[];
		[key: string]: any;
	} {
		const loggerOptionKeys = _.keys(LoggerConfigData);
		const dataToCheck = data.filter((el) => {
			// objects created with Object.create(null) do not have `hasOwnProperty` function
			if (
				!!el &&
				typeof el === "object" &&
				el.hasOwnProperty &&
				typeof el.hasOwnProperty === "function"
			) {
				for (const key of loggerOptionKeys) {
					if (el.hasOwnProperty(key)) {
						// include only the elements which have one of the keys we've specified as logger options
						return true;
					}
				}
			}

			return false;
		});

		const result: any = {
			data: _.difference(data, dataToCheck),
		};

		for (const element of dataToCheck) {
			if (loggerOptionKeys.length === 0) {
				break;
			}

			const remainingOpts = _.cloneDeep(loggerOptionKeys);
			for (const prop of remainingOpts) {
				const hasProp = element && element.hasOwnProperty(prop);
				if (hasProp) {
					loggerOptionKeys.splice(loggerOptionKeys.indexOf(prop), 1);
					result[prop] = element[prop];
				}
			}
		}

		return result;
	}

	private getPasswordEncodedArguments(args: string[]): string[] {
		return _.map(args, (argument) => {
			if (typeof argument === "string" && !!argument.match(/password/i)) {
				argument = argument.replace(
					this.passwordRegex,
					this.passwordReplacement,
				);
			}

			return argument;
		});
	}
}

injector.register("logger", Logger);
