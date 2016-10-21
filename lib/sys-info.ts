import { ChildProcess } from "./wrappers/child-process";
import * as Promise from "bluebird";
import * as path from "path";

export class SysInfo {
	// Different java has different format for `java -version` command.
	private static JAVA_VERSION_REGEXP = /(?:openjdk|java) version \"((?:\d+\.)+(?:\d+))/i;

	// For other versions of java javac version output is not on first line.
	// Thus can't use ^ for starts with in regex.
	private static JAVA_COMPILER_VERSION_REGEXP = /javac (.*)/i;

	private javaVerCache: string;
	private javaCompilerVerCache: string;

	constructor(private childProcess: ChildProcess) { }

	public getJavaVersion(): Promise<string> {
		if (!this.javaVerCache) {
			return new Promise<string>((resolve, reject) => {
				this.childProcess.spawnFromEvent("java", ["-version"], "exit")
					.then((spawnResult) => {
						this.javaVerCache = SysInfo.JAVA_VERSION_REGEXP.exec(spawnResult.stderr)[1];
						resolve(this.javaVerCache);
					})
					.catch((err) => {
						this.javaVerCache = null;
						resolve(this.javaVerCache);
					});
			});
		}

		return Promise.resolve(this.javaVerCache);
	}

	public getJavaCompilerVersion(): Promise<string> {
		if (!this.javaCompilerVerCache) {
			return new Promise<string>((resolve, reject) => {
				let javaCompileExecutableName = "javac";
				let javaHome = process.env.JAVA_HOME;
				let pathToJavaCompilerExecutable = javaHome ? path.join(javaHome, "bin", javaCompileExecutableName) : javaCompileExecutableName;
				this.childProcess.exec(`"${pathToJavaCompilerExecutable}" -version`)
					.then((output) => {
						this.javaCompilerVerCache = output ? SysInfo.JAVA_COMPILER_VERSION_REGEXP.exec(output.stderr)[1] : null;
						resolve(this.javaCompilerVerCache);
					})
					.catch((err) => {
						this.javaCompilerVerCache = null;
						resolve(this.javaCompilerVerCache);
					});
			});
		}

		return Promise.resolve(this.javaCompilerVerCache);
	}
}
