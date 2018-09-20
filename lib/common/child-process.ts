import * as child_process from "child_process";
import { EventEmitter } from "events";

export class ChildProcess extends EventEmitter implements IChildProcess {
	constructor(private $logger: ILogger,
		private $errors: IErrors) {
		super();
	}

	public async exec(command: string, options?: any, execOptions?: IExecOptions): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			const callback = (error: Error, stdout: NodeBuffer, stderr: NodeBuffer) => {
				this.$logger.trace("Exec %s \n stdout: %s \n stderr: %s", command, stdout.toString(), stderr.toString());

				if (error) {
					reject(error);
				} else {
					const output = execOptions && execOptions.showStderr ? { stdout, stderr } : stdout;
					resolve(output);
				}
			};

			if (options) {
				child_process.exec(command, options, callback);
			} else {
				child_process.exec(command, callback);
			}

		});
	}

	public async execFile(command: string, args: string[]): Promise<any> {
		this.$logger.debug("execFile: %s %s", command, this.getArgumentsAsQuotedString(args));

		return new Promise<any>((resolve, reject) => {
			child_process.execFile(command, args, (error: any, stdout: NodeBuffer) => {
				if (error) {
					reject(error);
				} else {
					resolve(stdout);
				}
			});

		});
	}

	public spawn(command: string, args?: string[], options?: any): child_process.ChildProcess {
		this.$logger.debug("spawn: %s %s", command, this.getArgumentsAsQuotedString(args));
		return child_process.spawn(command, args, options);
	}

	public fork(modulePath: string, args?: string[], options?: any): child_process.ChildProcess {
		this.$logger.debug("fork: %s %s", modulePath, this.getArgumentsAsQuotedString(args));
		return child_process.fork(modulePath, args, options);
	}

	public spawnFromEvent(command: string, args: string[], event: string,
		options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> { // event should be exit or close

		return new Promise<ISpawnResult>((resolve, reject) => {
			const childProcess = this.spawn(command, args, options);
			let isResolved = false;
			let capturedOut = "";
			let capturedErr = "";

			if (childProcess.stdout) {
				childProcess.stdout.on("data", (data: string) => {
					if (spawnFromEventOptions && spawnFromEventOptions.emitOptions && spawnFromEventOptions.emitOptions.eventName) {
						this.emit(spawnFromEventOptions.emitOptions.eventName, { data, pipe: 'stdout' });
					}

					capturedOut += data;
				});
			}

			if (childProcess.stderr) {
				childProcess.stderr.on("data", (data: string) => {
					if (spawnFromEventOptions && spawnFromEventOptions.emitOptions && spawnFromEventOptions.emitOptions.eventName) {
						this.emit(spawnFromEventOptions.emitOptions.eventName, { data, pipe: 'stderr' });
					}

					capturedErr += data;
				});
			}

			childProcess.on(event, (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
				const result = {
					stdout: capturedOut,
					stderr: capturedErr,
					exitCode: exitCode
				};

				if (spawnFromEventOptions && spawnFromEventOptions.throwError === false) {
					if (!isResolved) {
						this.$logger.trace("Result when throw error is false:");
						this.$logger.trace(result);
						isResolved = true;
						resolve(result);
					}
				} else {
					if (exitCode === 0) {
						isResolved = true;
						resolve(result);
					} else {
						let errorMessage = `Command ${command} failed with exit code ${exitCode}`;
						if (capturedErr) {
							errorMessage += ` Error output: \n ${capturedErr}`;
						}

						if (!isResolved) {
							isResolved = true;
							reject(new Error(errorMessage));
						}
					}
				}
			});

			childProcess.once("error", (err: Error) => {
				if (!isResolved) {
					if (spawnFromEventOptions && spawnFromEventOptions.throwError === false) {
						const result = {
							stdout: capturedOut,
							stderr: err.message,
							exitCode: (<any>err).code
						};
						isResolved = true;
						resolve(result);
					} else {
						isResolved = true;
						reject(err);
					}
				}
			});

		});
	}

	public async trySpawnFromCloseEvent(command: string, args: string[], options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		try {
			const childProcess = await this.spawnFromEvent(command, args, "close", options, spawnFromEventOptions);
			return childProcess;
		} catch (err) {
			this.$logger.trace(`Error from trySpawnFromCloseEvent method. More info: ${err}`);
			return Promise.resolve({ stderr: err && err.message ? err.message : err, stdout: null, exitCode: -1 });
		}
	}

	public async tryExecuteApplication(command: string, args: string[], event: string,
		errorMessage: string, condition: (_childProcess: any) => boolean): Promise<any> {
		const childProcess = await this.tryExecuteApplicationCore(command, args, event, errorMessage);

		if (condition && condition(childProcess)) {
			this.$errors.fail(errorMessage);
		}
	}

	private async tryExecuteApplicationCore(command: string, args: string[], event: string, errorMessage: string): Promise<any> {
		try {
			return this.spawnFromEvent(command, args, event, undefined, { throwError: false });
		} catch (e) {
			const message = (e.code === "ENOENT") ? errorMessage : e.message;
			this.$errors.failWithoutHelp(message);
		}
	}

	private getArgumentsAsQuotedString(args: string[]): string {
		return args && args.length && args.map(argument => `"${argument}"`).join(" ");
	}
}
$injector.register("childProcess", ChildProcess);
