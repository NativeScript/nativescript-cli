import { exec as _exec } from "child_process";
import type { ExecOptions } from "child_process";
import { returnFalse } from ".";

export interface IExecResult {
	stdout: string;
	stderr: string;
}

export function exec(
	command: string,
	options?: ExecOptions
): Promise<IExecResult> {
	return new Promise((resolve, reject) => {
		_exec(command, options, (err, stdout, stderr) => {
			if (err) {
				return reject(err);
			}

			resolve({
				stdout,
				stderr,
			});
		});
	});
}

export function execSafe(
	command: string,
	options?: ExecOptions
): Promise<IExecResult | false> {
	return exec(command, options).catch(returnFalse);
}

/*
export class ChildProcess {
	public exec(
		command: string,
		options?: childProcess.ExecOptions
	): Promise<IProcessInfo> {
		return new Promise<IProcessInfo>((resolve, reject) => {
			childProcess.exec(command, options, (err, stdout, stderr) => {
				if (err) {
					reject(err);
				}

				const result: IProcessInfo = {
					stdout,
					stderr,
				};

				resolve(result);
			});
		});
	}
}
*/
