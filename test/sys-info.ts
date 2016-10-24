import * as assert from "assert";
import * as Promise from "bluebird";
import * as path from "path";
import { SysInfo } from "../lib/sys-info";
import { ChildProcess } from "../lib/wrappers/child-process";

const JavaHomeName = "JAVA_HOME";

describe("SysInfo unit tests", () => {
	let sysInfo: SysInfo;
	let spawnFromEventCommand: string;
	let execCommand: string;

	beforeEach(() => {
		let childProcess: ChildProcess = {
			spawnFromEvent: (command: string, args: string[], event: string) => {
				spawnFromEventCommand = `${command} ${args.join(" ")}`;
				return Promise.resolve({ stdout: "", stderr: "" });
			},
			exec: (command: string) => {
				execCommand = command;
				return Promise.resolve({ stdout: "", stderr: "" });
			}
		};

		sysInfo = new SysInfo(childProcess);
	});

	describe("Should execute correct commands to check for", () => {
		it("java version.", (done: MochaDone) => {
			sysInfo.getJavaVersion()
				.then(version => {
					assert.deepEqual(spawnFromEventCommand, "java -version");
					done();
				});
		});

		it("java compiler version when there is JAVA_HOME.", (done: MochaDone) => {
			let pathToJavac = path.join(process.env[JavaHomeName], "bin", "javac");
			sysInfo.getJavaCompilerVersion()
				.then(version => {
					assert.deepEqual(execCommand, `"${pathToJavac}" -version`);
					done();
				});
		});

		it("java compiler version when there is no JAVA_HOME.", (done: MochaDone) => {
			let originalJavaHome = process.env[JavaHomeName];

			delete process.env[JavaHomeName];

			sysInfo.getJavaCompilerVersion()
				.then(version => {
					assert.deepEqual(execCommand, `"javac" -version`);
					process.env[JavaHomeName] = originalJavaHome;
					done();
				});
		});
	});
});
