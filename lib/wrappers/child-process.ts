import * as childProcess from "child_process";
import * as Promise from "bluebird";

export class ChildProcess {
	public spawnFromEvent(command: string, args: string[], event: string, options?: childProcess.SpawnOptions, ignoreError: boolean = false): Promise<IProcessInfo> {
		return new Promise<IProcessInfo>((resolve, reject) => {
			let commandChildProcess = childProcess.spawn(command, args, options);
			let capturedOut = "";
			let capturedErr = "";

			if (commandChildProcess.stdout) {
				commandChildProcess.stdout.on("data", (data: string) => {
					capturedOut += data;
				});
			}

			if (commandChildProcess.stderr) {
				commandChildProcess.stderr.on("data", (data: string) => {
					capturedErr += data;
				});
			}

			commandChildProcess.on(event, (arg: any) => {
				let exitCode = typeof arg === "number" ? arg : arg && arg.code;
				let result = {
					stdout: capturedOut,
					stderr: capturedErr,
					exitCode: exitCode
				};

				if (ignoreError) {
					resolve(result);
				} else {
					if (exitCode === 0) {
						resolve(result);
					} else {
						let errorMessage = `Command ${command} failed with exit code ${exitCode}`;
						if (capturedErr) {
							errorMessage += ` Error output: \n ${capturedErr}`;
						}

						throw new Error(errorMessage);
					}
				}
			});

			commandChildProcess.once("error", (err: Error) => {
				if (ignoreError) {
					let result = {
						stdout: capturedOut,
						stderr: err.message,
						exitCode: (<any>err).code
					};
					resolve(result);
				} else {
					throw err;
				}
			});
		});
	}

	public exec(command: string, options?: childProcess.ExecOptions): Promise<IProcessInfo> {
		return new Promise<IProcessInfo>((resolve, reject) => {
			childProcess.exec(command, options, (err, stdout, stderr) => {
				if (err) {
					throw err;
				}

				let result: IProcessInfo = {
					stdout,
					stderr
				};

				resolve(result);
			});
		});
	}
}
