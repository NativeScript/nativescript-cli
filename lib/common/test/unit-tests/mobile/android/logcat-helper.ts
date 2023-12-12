import { LogcatHelper } from "../../../../mobile/android/logcat-helper";
import { Yok } from "../../../../yok";
import { assert } from "chai";
import * as path from "path";
import * as childProcess from "child_process";
import * as fileSystem from "fs";
import { EventEmitter } from "events";
import * as stream from "stream";
import { IInjector } from "../../../../definitions/yok";

// 1 for the logs, and 1 for START/pid discovery
const PROCESS_COUNT_PER_DEVICE = 2;

class ChildProcessMockInstance extends EventEmitter {
	public stdout: stream.Readable;
	public stderr: any;
	public processKillCallCount = 0;

	constructor(pathToSample: string) {
		super();
		this.stdout = fileSystem.createReadStream(pathToSample);
		this.stderr = new EventEmitter();
	}

	public kill(): void {
		this.processKillCallCount++;
	}
}

class ChildProcessStub {
	public processSpawnCallCount = 0;
	public adbProcessArgs: string[] = [];
	public lastSpawnedProcess: ChildProcessMockInstance = null;
	public spawnedProcesses: {
		args: string[];
		childProcess: ChildProcessMockInstance;
	}[] = [];

	public spawn(
		command: string,
		args?: string[],
		options?: any
	): childProcess.ChildProcess {
		this.adbProcessArgs = args;
		this.processSpawnCallCount++;
		const pathToSample = path.join(__dirname, "valid-sample.txt");

		this.lastSpawnedProcess = new ChildProcessMockInstance(pathToSample);
		this.spawnedProcesses.push({
			args,
			childProcess: this.lastSpawnedProcess,
		});

		return <any>this.lastSpawnedProcess;
	}
}

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("injector", injector);
	injector.register("logcatHelper", LogcatHelper);
	injector.register("logger", {
		debug(formatStr?: any, ...args: any[]): void {
			//left blank intentionally because of lint
		},
		trace(formatStr?: any, ...args: any[]): void {
			if (formatStr && formatStr.indexOf("ADB") !== -1) {
				//loghelper failed or socket closed"
				assert.isTrue(false);
			}
		},
	});
	injector.register("errors", {});
	injector.register("devicesService", {
		getDevice: (): Mobile.IDevice => {
			return <Mobile.IDevice>{
				deviceInfo: {
					version: "9.0.0",
				},
			};
		},
	});
	injector.register("devicePlatformsConstants", { Android: "Android" });
	injector.register("deviceLogProvider", {
		logData(line: string, platform: string, deviceIdentifier: string): void {
			//left blank intentionally because of lint
		},
	});
	injector.register("childProcess", ChildProcessStub);
	injector.register("staticConfig", {
		async getAdbFilePath(): Promise<string> {
			return "";
		},
	});
	injector.register("androidDebugBridgeResultHandler", {});

	return injector;
}

function startLogcatHelper(
	injector: IInjector,
	startOptions: { deviceIdentifier: string; pid?: string }
) {
	const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");
	/* tslint:disable:no-floating-promises */
	logcatHelper.start(startOptions);
	/* tslint:enable:no-floating-promises */
}

describe("logcat-helper", () => {
	const validIdentifier = "valid-identifier";
	let injector: IInjector;
	let loggedData: string[];
	let childProcessStub: ChildProcessStub;

	beforeEach(() => {
		injector = createTestInjector();
		loggedData = [];
		childProcessStub = injector.resolve<ChildProcessStub>("childProcess");
	});

	describe("start", () => {
		it("should read the whole logcat correctly", (done: mocha.Done) => {
			injector.register("deviceLogProvider", {
				logData(
					line: string,
					platform: string,
					deviceIdentifier: string
				): void {
					loggedData.push(line);
					if (line === "end") {
						assert.isAbove(loggedData.length, 0);
						done();
					}
				},
			});

			startLogcatHelper(injector, { deviceIdentifier: validIdentifier });
		});

		it("should pass the pid filter to the adb process", (done: mocha.Done) => {
			const expectedPid = "MyCoolPid";
			injector.register("deviceLogProvider", {
				logData(
					line: string,
					platform: string,
					deviceIdentifier: string
				): void {
					loggedData.push(line);
					if (line === "end") {
						assert.equal(
							childProcessStub.processSpawnCallCount,
							PROCESS_COUNT_PER_DEVICE
						);
						const adbProcessArgs = childProcessStub.spawnedProcesses[0].args;
						assert.include(adbProcessArgs, `--pid=${expectedPid}`);
						done();
					}
				},
			});

			startLogcatHelper(injector, {
				deviceIdentifier: validIdentifier,
				pid: expectedPid,
			});
		});

		it("should not pass the pid filter to the adb process when Android version is less than 7", (done: mocha.Done) => {
			const expectedPid = "MyCoolPid";
			injector.register("devicesService", {
				getDevice: (): Mobile.IDevice => {
					return <Mobile.IDevice>{
						deviceInfo: {
							version: "6.0.0",
						},
					};
				},
			});

			injector.register("deviceLogProvider", {
				logData(
					line: string,
					platform: string,
					deviceIdentifier: string
				): void {
					loggedData.push(line);
					if (line === "end") {
						assert.notInclude(
							childProcessStub.adbProcessArgs,
							`--pid=${expectedPid}`
						);
						done();
					}
				},
			});

			startLogcatHelper(injector, {
				deviceIdentifier: validIdentifier,
				pid: expectedPid,
			});
		});

		it("should start a single adb process when called multiple times with the same identifier", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});
			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});
			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});

			assert.equal(
				childProcessStub.processSpawnCallCount,
				PROCESS_COUNT_PER_DEVICE
			);
		});

		it("should start multiple logcat processes when called multiple times with different identifiers", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}1`,
			});
			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}2`,
			});
			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}3`,
			});

			assert.equal(
				childProcessStub.processSpawnCallCount,
				3 * PROCESS_COUNT_PER_DEVICE
			);
		});
	});
	describe("stop", () => {
		it("should clear the device identifier", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});
			assert.equal(
				childProcessStub.processSpawnCallCount,
				PROCESS_COUNT_PER_DEVICE
			);
			await logcatHelper.stop(validIdentifier);
			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});

			assert.equal(
				childProcessStub.processSpawnCallCount,
				2 * PROCESS_COUNT_PER_DEVICE
			);
		});

		it("should kill the process just once if called multiple times", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
			});
			await logcatHelper.stop(validIdentifier);
			await logcatHelper.stop(validIdentifier);

			assert.equal(childProcessStub.lastSpawnedProcess.processKillCallCount, 1);
		});

		it("should not kill the process if started with keepSingleProcess", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
				keepSingleProcess: true,
			});

			await logcatHelper.stop(validIdentifier);
			await logcatHelper.stop(validIdentifier);
			assert.equal(childProcessStub.lastSpawnedProcess.processKillCallCount, 0);
		});

		it("should do nothing if called without start", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.stop(validIdentifier);

			assert.equal(childProcessStub.processSpawnCallCount, 0);
		});

		for (const keepSingleProcess of [false, true]) {
			it(`should clear the device identifier cache when the logcat process is killed manually and keepSingleProcess is ${keepSingleProcess}`, async () => {
				const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

				await logcatHelper.start({
					deviceIdentifier: validIdentifier,
					keepSingleProcess,
				});

				assert.equal(
					childProcessStub.processSpawnCallCount,
					PROCESS_COUNT_PER_DEVICE
				);

				childProcessStub.spawnedProcesses.forEach((spawnedProcess) => {
					spawnedProcess.childProcess.emit("close");
				});

				await logcatHelper.start({
					deviceIdentifier: validIdentifier,
				});

				assert.equal(
					childProcessStub.processSpawnCallCount,
					2 * PROCESS_COUNT_PER_DEVICE
				);
			});
		}
	});
});
