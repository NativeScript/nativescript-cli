import { Contract } from "../common/di/contract";
import type { IFailOptions } from "../common/declarations";

/**
 * Raises CLI failures and wraps command execution so they are reported and
 * turned into a process exit code.
 */
@Contract({ name: "errors" })
export abstract class Errors {
	abstract fail(formatStr: string, ...args: any[]): never;
	abstract fail(opts: IFailOptions, ...args: any[]): never;

	/**
	 * @deprecated use `fail` instead
	 */
	abstract failWithoutHelp(message: string, ...args: any[]): never;
	/**
	 * @deprecated use `fail` instead
	 */
	abstract failWithoutHelp(opts: IFailOptions, ...args: any[]): never;

	abstract failWithHelp(formatStr: string, ...args: any[]): never;
	abstract failWithHelp(opts: IFailOptions, ...args: any[]): never;

	abstract beginCommand(
		action: () => Promise<boolean>,
		printCommandHelp: () => Promise<void>,
	): Promise<boolean>;

	abstract verifyHeap(message: string): void;

	abstract printCallStack: boolean;
}
