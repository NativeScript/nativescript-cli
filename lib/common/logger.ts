import * as log4js from "log4js";
import * as util from "util";
import * as stream from "stream";
import * as marked from "marked";
const TerminalRenderer = require("marked-terminal");
const chalk = require("chalk");

export class Logger implements ILogger {
	private log4jsLogger: log4js.ILogger = null;
	private passwordRegex = /(password=).*?(['&,]|$)|(password["']?\s*:\s*["']).*?(["'])/i;
	private passwordReplacement = "$1$3*******$2$4";
	private static LABEL = "[WARNING]:";

	constructor($config: Config.IConfig,
		private $options: ICommonOptions) {
		const appenders: log4js.IAppender[] = [];

		if (!$config.CI_LOGGER) {
			appenders.push({
				type: "console",
				layout: {
					type: "messagePassThrough"
				}
			});
		}

		log4js.configure({ appenders: appenders });

		this.log4jsLogger = log4js.getLogger();

		if (this.$options.log) {
			this.log4jsLogger.setLevel(this.$options.log);
		} else {
			this.log4jsLogger.setLevel($config.DEBUG ? "TRACE" : "INFO");
		}
	}

	setLevel(level: string): void {
		this.log4jsLogger.setLevel(level);
	}

	getLevel(): string {
		return this.log4jsLogger.level.toString();
	}

	fatal(...args: string[]): void {
		this.log4jsLogger.fatal.apply(this.log4jsLogger, args);
	}

	error(...args: string[]): void {
		const message = util.format.apply(null, args);
		const colorizedMessage = message.red;

		this.log4jsLogger.error.apply(this.log4jsLogger, [colorizedMessage]);
	}

	warn(...args: string[]): void {
		const message = util.format.apply(null, args);
		const colorizedMessage = message.yellow;

		this.log4jsLogger.warn.apply(this.log4jsLogger, [colorizedMessage]);
	}

	warnWithLabel(...args: string[]): void {
		const message = util.format.apply(null, args);
		this.warn(`${Logger.LABEL} ${message}`);
	}

	info(...args: string[]): void {
		this.log4jsLogger.info.apply(this.log4jsLogger, args);
	}

	debug(...args: string[]): void {
		const encodedArgs: string[] = this.getPasswordEncodedArguments(args);
		this.log4jsLogger.debug.apply(this.log4jsLogger, encodedArgs);
	}

	trace(...args: string[]): void {
		const encodedArgs: string[] = this.getPasswordEncodedArguments(args);
		this.log4jsLogger.trace.apply(this.log4jsLogger, encodedArgs);
	}

	out(...args: string[]): void {
		console.log(util.format.apply(null, args));
	}

	write(...args: string[]): void {
		process.stdout.write(util.format.apply(null, args));
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

	public printInfoMessageOnSameLine(message: string): void {
		if (!this.$options.log || this.$options.log === "info") {
			this.write(message);
		}
	}

	public printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			setTimeout(() => {
				this.printInfoMessageOnSameLine(message);
				resolve();
			}, timeout);

		});
	}

	public printMarkdown(...args: string[]): void {
		const opts = {
			unescape: true,
			link: chalk.red,
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
		this.write(formattedMessage);
	}

	private getPasswordEncodedArguments(args: string[]): string[] {
		return _.map(args, argument => {
			if (typeof argument === 'string' && !!argument.match(/password/i)) {
				argument = argument.replace(this.passwordRegex, this.passwordReplacement);
			}

			return argument;
		});
	}
}

$injector.register("logger", Logger);
