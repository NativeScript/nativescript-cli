import * as util from "util";
import * as path from "path";
import { SourceMapConsumer } from "source-map";

// we need this to overwrite .stack property (read-only in Error)
function Exception() {
	/* intentionally left blank */
}

Exception.prototype = new Error();

function resolveCallStack(error: Error): string {
	const stackLines: string[] = error.stack.split("\n");
	const parsed = _.map(stackLines, (line: string): any => {
		let match = line.match(/^\s*at ([^(]*) \((.*?):([0-9]+):([0-9]+)\)$/);
		if (match) {
			return match;
		}

		match = line.match(/^\s*at (.*?):([0-9]+):([0-9]+)$/);
		if (match) {
			match.splice(1, 0, "<anonymous>");
			return match;
		}

		return line;
	});

	const fs = require("fs");

	const remapped = _.map(parsed, (parsedLine) => {
		if (_.isString(parsedLine)) {
			return parsedLine;
		}

		const functionName = parsedLine[1];
		const fileName = parsedLine[2];
		const line = +parsedLine[3];
		const column = +parsedLine[4];

		const mapFileName = fileName + ".map";
		if (!fs.existsSync(mapFileName)) {
			return parsedLine.input;
		}

		const mapData = JSON.parse(fs.readFileSync(mapFileName).toString());

		const consumer = new SourceMapConsumer(mapData);
		const sourcePos = consumer.originalPositionFor({ line: line, column: column });
		if (sourcePos && sourcePos.source) {
			const source = path.join(path.dirname(fileName), sourcePos.source);
			return util.format("    at %s (%s:%s:%s)", functionName, source, sourcePos.line, sourcePos.column);
		}

		return util.format("    at %s (%s:%s:%s)", functionName, fileName, line, column);
	});

	let outputMessage = remapped.join("\n");

	if (outputMessage.indexOf(error.message) === -1) {
		// when fibers throw error in node 0.12.x, the stack does NOT contain the message
		outputMessage = outputMessage.replace(/Error/, "Error: " + error.message);
	}

	return outputMessage;
}

export function installUncaughtExceptionListener(actionOnException?: () => void): void {
	const handler = async (err: Error) => {
		try {
			let callstack = err.stack;
			if (callstack) {
				try {
					callstack = resolveCallStack(err);
				} catch (err) {
					console.error("Error while resolving callStack:", err);
				}
			}

			console.error(callstack || err.toString());

			await tryTrackException(err, $injector);

			if (actionOnException) {
				actionOnException();
			}

		} catch (err) {
			// In case the handler throws error and we do not catch it, we'll go in infinite loop of unhandled rejections.
			// We cannot do anything here as even `console.error` may fail. So just exit the process.
			process.exit(ErrorCodes.UNHANDLED_REJECTION_FAILURE);
		}
	};

	process.on("uncaughtException", handler);
	process.on("unhandledRejection", handler);
}

async function tryTrackException(error: Error, injector: IInjector): Promise<void> {
	let disableAnalytics: boolean;
	try {
		disableAnalytics = injector.resolve("staticConfig").disableAnalytics;
	} catch (err) {
		// We should get here only in our unit tests.
		disableAnalytics = true;
	}

	if (!disableAnalytics) {
		try {
			const analyticsService = injector.resolve("analyticsService");
			await analyticsService.trackException(error, error.message);
		} catch (e) {
			// Do not replace with logger due to cyclic dependency
			console.error("Error while reporting exception: " + e);
		}
	}
}

export class Errors implements IErrors {
	constructor(private $injector: IInjector) {
	}

	public printCallStack: boolean = false;

	public fail(optsOrFormatStr: any, ...args: any[]): never {
		const argsArray = args || [];

		let opts = optsOrFormatStr;
		if (_.isString(opts)) {
			opts = { formatStr: opts };
		}

		const exception: any = new (<any>Exception)();
		exception.name = opts.name || "Exception";
		exception.message = util.format.apply(null, [opts.formatStr].concat(argsArray));
		try {
			const $messagesService = this.$injector.resolve("messagesService");
			exception.message = $messagesService.getMessage.apply($messagesService, [opts.formatStr].concat(argsArray));
		} catch (err) {
			// Ignore
		}
		exception.stack = (new Error(exception.message)).stack;
		exception.errorCode = opts.errorCode || ErrorCodes.UNKNOWN;
		exception.suppressCommandHelp = opts.suppressCommandHelp;
		exception.proxyAuthenticationRequired = !!opts.proxyAuthenticationRequired;
		exception.printOnStdout = opts.printOnStdout;
		this.$injector.resolve("logger").trace(opts.formatStr);
		throw exception;
	}

	public failWithoutHelp(message: string, ...args: any[]): never {
		args.unshift(message);
		return this.fail({ formatStr: util.format.apply(null, args), suppressCommandHelp: true });
	}

	public async beginCommand(action: () => Promise<boolean>, printCommandHelp: () => Promise<void>): Promise<boolean> {
		try {
			return await action();
		} catch (ex) {
			const loggerLevel: string = $injector.resolve("logger").getLevel().toUpperCase();
			const printCallStack = this.printCallStack || loggerLevel === "TRACE" || loggerLevel === "DEBUG";
			const message = printCallStack ? resolveCallStack(ex) : `\x1B[31;1m${ex.message}\x1B[0m`;

			if (ex.printOnStdout) {
				this.$injector.resolve("logger").out(message);
			} else {
				console.error(message);
			}

			if (!ex.suppressCommandHelp) {
				try {
					await printCommandHelp();
				} catch (printHelpException) {
					console.error("Failed to display command help", printHelpException);
				}
			}

			await tryTrackException(ex, this.$injector);
			process.exit(_.isNumber(ex.errorCode) ? ex.errorCode : ErrorCodes.UNKNOWN);
		}
	}

	// If you want to activate this function, start Node with flags --nouse_idle_notification and --expose_gc
	verifyHeap(message: string): void {
		if (global.gc) {
			console.log("verifyHeap: '%s'", message);
			global.gc();
		}
	}
}

$injector.register("errors", Errors);
