import { LogcatHelper } from "../../../../mobile/android/logcat-helper";
import { Yok } from "../../../../yok";
import { assert } from "chai";
import * as path from "path";
import * as childProcess from "child_process";

class ChildProcessStub {
	public processSpawnCallCount = 0;
	public processKillCallCount = 0;
	public adbProcessArgs: string[] = [];
	private isWin = /^win/.test(process.platform);

	public spawn(command: string, args?: string[], options?: any): childProcess.ChildProcess {
		this.adbProcessArgs = args;
		this.processSpawnCallCount++;
		let pathToExecutable = "";
		let shell = "";
		if (this.isWin) {
			pathToExecutable = "type";
			shell = "cmd";
		} else {
			pathToExecutable = "cat";
		}
		pathToExecutable = path.join(pathToExecutable);
		const pathToSample = path.join(__dirname, "valid-sample.txt");
		const spawnedProcess = childProcess.spawn(pathToExecutable, [pathToSample], { shell });
		const spawnedProcessKill = spawnedProcess.kill;
		spawnedProcess.kill = (signal: string) => {
			this.processKillCallCount++;
			spawnedProcessKill.call(spawnedProcessKill, signal);
		};

		return spawnedProcess;
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
		}
	});
	injector.register("errors", {});
	injector.register("devicesService", {
		getDevice: (): Mobile.IDevice => {
			return <Mobile.IDevice>{
					deviceInfo: {
						version: "9.0.0"
					}
				} ;
		}
	});
	injector.register("devicePlatformsConstants", { Android: "Android" });
	injector.register("processService", {
		attachToProcessExitSignals(context: any, callback: () => void): void {
			//left blank intentionally because of lint
		},
	});
	injector.register("deviceLogProvider", {
		logData(line: string, platform: string, deviceIdentifier: string): void {
			//left blank intentionally because of lint
		},
	});
	injector.register("childProcess", ChildProcessStub);
	injector.register("staticConfig", {
		async getAdbFilePath(): Promise<string> {
			return "";
		}
	});
	injector.register("androidDebugBridgeResultHandler", {});

	return injector;
}

function startLogcatHelper(injector: IInjector, startOptions: { deviceIdentifier: string, pid?: string }) {
	const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");
	/* tslint:disable:no-floating-promises */
	logcatHelper.start(startOptions);
	/* tslint:enable:no-floating-promises */
}

describe("logcat-helper", () => {
	const validIdentifier = "valid-identifier";
	let injector: IInjector;
	let loggedData: string[];
	let childProcess: ChildProcessStub;

	beforeEach(() => {
		injector = createTestInjector();
		loggedData = [];
		childProcess = injector.resolve<ChildProcessStub>("childProcess");
	});

	describe("start", () => {
		it("should read the whole logcat correctly", (done: mocha.Done) => {
			injector.register("deviceLogProvider", {
				logData(line: string, platform: string, deviceIdentifier: string): void {
					loggedData.push(line);
					if (line === "end") {
						assert.isAbove(loggedData.length, 0);
						done();
					}
				}
			});

			startLogcatHelper(injector, { deviceIdentifier: validIdentifier });
		});

		it("should pass the pid filter to the adb process", (done: mocha.Done) => {
			const expectedPid = "MyCoolPid";
			injector.register("deviceLogProvider", {
				logData(line: string, platform: string, deviceIdentifier: string): void {
					loggedData.push(line);
					if (line === "end") {
						assert.include(childProcess.adbProcessArgs, `--pid=${expectedPid}`);
						done();
					}
				}
			});

			startLogcatHelper(injector, { deviceIdentifier: validIdentifier, pid: expectedPid });
		});

		it("should not pass the pid filter to the adb process when Android version is less than 7", (done: mocha.Done) => {
			const expectedPid = "MyCoolPid";
			injector.register("devicesService", {
				getDevice: (): Mobile.IDevice => {
					return <Mobile.IDevice>{
							deviceInfo: {
								version: "6.0.0"
							}
						} ;
				}
			});

			injector.register("deviceLogProvider", {
				logData(line: string, platform: string, deviceIdentifier: string): void {
					loggedData.push(line);
					if (line === "end") {
						assert.notInclude(childProcess.adbProcessArgs, `--pid=${expectedPid}`);
						done();
					}
				}
			});

			startLogcatHelper(injector, { deviceIdentifier: validIdentifier, pid: expectedPid });
		});

		it("should start a single adb process when called multiple times with the same identifier", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});
			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});
			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});

			assert.equal(childProcess.processSpawnCallCount, 1);
		});

		it("should start multiple logcat processes when called multiple times with different identifiers", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}1`
			});
			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}2`
			});
			await logcatHelper.start({
				deviceIdentifier: `${validIdentifier}3`
			});

			assert.equal(childProcess.processSpawnCallCount, 3);
		});
	});
	describe("stop", () => {
		it("should clear the device identifier", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});
			assert.equal(childProcess.processSpawnCallCount, 1);
			await logcatHelper.stop(validIdentifier);
			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});

			assert.equal(childProcess.processSpawnCallCount, 2);
		});

		it("should kill the process just once if called multiple times", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier
			});
			await logcatHelper.stop(validIdentifier);
			await logcatHelper.stop(validIdentifier);

			assert.equal(childProcess.processKillCallCount, 1);
		});

		it("should not kill the process if started with keepSingleProcess", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.start({
				deviceIdentifier: validIdentifier,
				keepSingleProcess: true
			});

			await logcatHelper.stop(validIdentifier);
			await logcatHelper.stop(validIdentifier);
			assert.equal(childProcess.processKillCallCount, 0);
		});

		it("should do nothing if called without start", async () => {
			const logcatHelper = injector.resolve<LogcatHelper>("logcatHelper");

			await logcatHelper.stop(validIdentifier);

			assert.equal(childProcess.processSpawnCallCount, 0);
			assert.equal(childProcess.processKillCallCount, 0);
		});
	});
});
