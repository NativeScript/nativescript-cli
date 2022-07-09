import * as childProcess from "child_process";

export class ChildProcess {
	public spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: ISpawnFromEventOptions
	): Promise<IProcessInfo> {
		return new Promise<IProcessInfo>((resolve, reject) => {
			options = options || {};
			const commandChildProcess = childProcess.spawn(
				command,
				args,
				options.spawnOptions
			);
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
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
				const result = {
					stdout: capturedOut,
					stderr: capturedErr,
					exitCode: exitCode,
				};

				if (options.ignoreError) {
					resolve(result);
				} else {
					if (exitCode === 0) {
						resolve(result);
					} else {
						let errorMessage = `Command ${command} failed with exit code ${exitCode}`;
						if (capturedErr) {
							errorMessage += ` Error output: \n ${capturedErr}`;
						}

						reject(errorMessage);
					}
				}
			});

			commandChildProcess.once("error", (err: Error) => {
				if (options.ignoreError) {
					const result = {
						stdout: capturedOut,
						stderr: err.message,
						exitCode: (<any>err).code,
					};
					resolve(result);
				} else {
					reject(err);
				}
			});
		});
	}

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

	public execSync(
		command: string,
		options?: childProcess.ExecSyncOptions
	): string {
		return childProcess.execSync(command, options).toString();
	}

	public execFile(command: string, args: string[]): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			childProcess.execFile(command, args, (error, stdout) => {
				if (error) {
					reject(error);
				} else {
					resolve(stdout);
				}
			});
		});
	}
}
