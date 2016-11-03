import { ChildProcess } from "./wrappers/child-process";
import * as path from "path";

export class SysInfo {
	// Different java has different format for `java -version` command.
	private static JAVA_VERSION_REGEXP = /(?:openjdk|java) version \"((?:\d+\.)+(?:\d+))/i;

	private static JAVA_COMPILER_VERSION_REGEXP = /^javac (.*)/im;

	private javaVerCache: string;
	private javaCompilerVerCache: string;

	constructor(private childProcess: ChildProcess) { }

	public async getJavaVersion(): Promise<string> {
		if (!this.javaVerCache) {
			const spawnResult = await this.childProcess.spawnFromEvent("java", ["-version"], "exit", { ignoreError: true });
			const matches = spawnResult && SysInfo.JAVA_VERSION_REGEXP.exec(spawnResult.stderr);
			this.javaVerCache = matches && matches[1];
		}

		return this.javaVerCache;
	}

	public async getJavaCompilerVersion(): Promise<string> {
		if (!this.javaCompilerVerCache) {
			const javaCompileExecutableName = "javac";
			const javaHome = process.env.JAVA_HOME;
			const pathToJavaCompilerExecutable = javaHome ? path.join(javaHome, "bin", javaCompileExecutableName) : javaCompileExecutableName;
			try {
				const output = await this.childProcess.exec(`"${pathToJavaCompilerExecutable}" -version`);
				this.javaCompilerVerCache = SysInfo.JAVA_COMPILER_VERSION_REGEXP.exec(output.stderr)[1];
			} catch (err) {
				this.javaCompilerVerCache = null;
			}
		}

		return this.javaCompilerVerCache;
	}
}
