import { Contract } from "../common/di/contract";

/**
 * Writes the CLI's output, filtered by the configured log level.
 */
@Contract({ name: "logger" })
export abstract class Logger {
	abstract initialize(opts?: ILoggerOptions): void;

	abstract initializeCliLogger(opts?: ILoggerOptions): void;

	abstract getLevel(): string;

	abstract fatal(formatStr?: any, ...args: any[]): void;

	abstract error(formatStr?: any, ...args: any[]): void;

	abstract warn(formatStr?: any, ...args: any[]): void;

	abstract info(formatStr?: any, ...args: any[]): void;

	abstract debug(formatStr?: any, ...args: any[]): void;

	abstract trace(formatStr?: any, ...args: any[]): void;

	abstract printMarkdown(...args: any[]): void;

	abstract prepare(item: any): string;

	abstract isVerbose(): boolean;

	abstract clearScreen(): void;
}
