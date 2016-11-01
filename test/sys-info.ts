import * as assert from "assert";
import * as path from "path";
import { SysInfo } from "../lib/sys-info";
import { ChildProcess } from "../lib/wrappers/child-process";

const JavaHomeName = "JAVA_HOME";

describe("SysInfo unit tests", () => {
	let sysInfo: SysInfo;
	let spawnFromEventCommand: string;
	let execCommand: string;

	beforeEach(() => {
		const childProcess: ChildProcess = {
			spawnFromEvent: async (command: string, args: string[], event: string) => {
				spawnFromEventCommand = `${command} ${args.join(" ")}`;
				return { stdout: "", stderr: "" };
			},
			exec: async (command: string) => {
				execCommand = command;
				return { stdout: "", stderr: "" };
			}
		};

		sysInfo = new SysInfo(childProcess);
	});

	describe("Should execute correct commands to check for", () => {
		it("java version.", async () => {
			await sysInfo.getJavaVersion();
			assert.deepEqual(spawnFromEventCommand, "java -version");
		});

		it("java compiler version when there is JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			process.env[JavaHomeName] = "mock";

			const pathToJavac = path.join(process.env[JavaHomeName], "bin", "javac");
			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommand, `"${pathToJavac}" -version`);
		});

		it("java compiler version when there is no JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];

			delete process.env[JavaHomeName];

			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommand, `"javac" -version`);
		});
	});
});
