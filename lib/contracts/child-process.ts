import { Contract } from "../common/di/contract";
import type * as child_process from "child_process";
import type {
	IExecOptions,
	ISpawnFromEventOptions,
	ISpawnResult,
} from "../common/declarations";

/**
 * Promise-based wrapper around Node's `child_process` module.
 */
@Contract({ name: "childProcess" })
export abstract class ChildProcess {
	abstract exec(
		command: string,
		options?: any,
		execOptions?: IExecOptions,
	): Promise<any>;

	abstract execFile<T>(command: string, args: string[]): Promise<T>;

	abstract spawn(
		command: string,
		args?: string[],
		options?: any,
	): child_process.ChildProcess;

	abstract spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: any,
		spawnFromEventOptions?: ISpawnFromEventOptions,
	): Promise<ISpawnResult>;

	abstract trySpawnFromCloseEvent(
		command: string,
		args: string[],
		options?: any,
		spawnFromEventOptions?: ISpawnFromEventOptions,
	): Promise<ISpawnResult>;

	abstract tryExecuteApplication(
		command: string,
		args: string[],
		event: string,
		errorMessage: string,
		condition?: (childProcess: any) => boolean,
	): Promise<any>;

	/**
	 * This is a special case of the child_process.spawn() functionality for spawning Node.js processes.
	 * In addition to having all the methods in a normal ChildProcess instance, the returned object has a communication channel built-in.
	 * Note: Unlike the fork() POSIX system call, child_process.fork() does not clone the current process.
	 * @param {string} modulePath String The module to run in the child
	 * @param {string[]} args Array List of string arguments You can access them in the child with 'process.argv'.
	 * @param {string} options Object
	 * @return {child_process} ChildProcess object.
	 */
	abstract fork(
		modulePath: string,
		args?: string[],
		options?: {
			cwd?: string;
			env?: any;
			execPath?: string;
			execArgv?: string[];
			silent?: boolean;
			uid?: number;
			gid?: number;
		},
	): any;
}

// The event-emitter surface is merged in rather than inherited: `extends
// EventEmitter` would need a runtime import, and everything reachable from
// lib/contracts must stay side-effect-free.
export interface ChildProcess extends NodeJS.EventEmitter {}
