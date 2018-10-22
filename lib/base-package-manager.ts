import * as child_process from 'child_process';

export class BasePackageManager {
	constructor(private packageManager: string) { }

	protected getNpmExecutableName(isWindows: boolean): string {
		let npmExecutableName = this.packageManager;

		if (isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	protected async processPackageManagerInstall(
		childProcess: child_process.ChildProcess,
		isWindows: boolean,
		params: string[],
	): Promise<ISpawnResult> {
		return new Promise<ISpawnResult>((resolve, reject) => {
			let isFulfilled = false;
			let capturedOut = "";
			let capturedErr = "";

			const npmExecutable = this.getNpmExecutableName(isWindows);

			if (childProcess.stdout) {
				childProcess.stdout.on("data", (data: string) => {
					capturedOut += data;
				});
			}

			if (childProcess.stderr) {
				childProcess.stderr.on("data", (data: string) => {
					capturedErr += data;
				});
			}

			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;

				if (exitCode === 0) {
					isFulfilled = true;
					const result = {
						stdout: capturedOut,
						stderr: capturedErr,
						exitCode
					};

					resolve(result);
				} else {
					let errorMessage = `Command ${npmExecutable} ${params && params.join(" ")} failed with exit code ${exitCode}`;
					if (capturedErr) {
						errorMessage += ` Error output: \n ${capturedErr}`;
					}

					if (!isFulfilled) {
						isFulfilled = true;
						reject(new Error(errorMessage));
					}
				}
			});

			childProcess.on("error", (err: Error) => {
				if (!isFulfilled) {
					isFulfilled = true;
					reject(err);
				}
			});
		});
	}

	protected getFlagsString(config: any, asArray: boolean): any {
		const array: Array<string> = [];
		for (const flag in config) {
			if (flag === "global" && this.packageManager !== 'yarn') {
				array.push(`--${flag}`);
				array.push(`${config[flag]}`);
			} else if (config[flag]) {
				if (flag === "dist-tags" || flag === "versions") {
					array.push(` ${flag}`);
					continue;
				}
				array.push(`--${flag}`);
			}
		}
		if (asArray) {
			return array;
		}

		return array.join(" ");
	}
}
