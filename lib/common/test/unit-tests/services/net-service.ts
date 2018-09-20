import { Net } from "../../../services/net-service";
import { assert } from "chai";
import { Yok } from "../../../yok";
import { ErrorsStub, CommonLoggerStub } from "../stubs";
import { EOL } from "os";

describe("net", () => {
	const createTestInjector = (platform: string): IInjector => {
		const testInjector = new Yok();
		testInjector.register("errors", ErrorsStub);
		testInjector.register("childProcess", {});
		testInjector.register("logger", CommonLoggerStub);
		testInjector.register("osInfo", {
			platform: () => platform
		});

		return testInjector;
	};

	describe("waitForPortToListen", () => {
		let execCalledCount = 0;
		beforeEach(() => {
			execCalledCount = 0;
		});

		const createNetStatResult = (testInjector: IInjector, platform: string, port?: number, iteration?: number): void => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");

			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				const platformsData: IDictionary<any> = {
					linux: {
						data: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 192.168.122.1:53        0.0.0.0:*               LISTEN
tcp        0      0 127.0.1.1:53            0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN
tcp6       0      0 :::60433                :::*                    LISTEN
tcp6       0      0 ::1:631                 :::*                    LISTEN`,
						portData: `tcp6       0      0 :::${port}                 :::*                    LISTEN`
					},

					darwin: {
						data: `Current listen queue sizes (qlen/incqlen/maxqlen)
Listen         Local Address
0/0/1          127.0.0.1.9335
0/0/1          127.0.0.1.9334
0/0/1          127.0.0.1.9333
0/0/128        *.3283
0/0/128        *.88
0/0/128        *.22`,
						portData: `0/0/128        *.${port}`
					},
					win32: {
						data: `
Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING
  TCP    0.0.0.0:60061          0.0.0.0:0              LISTENING
  TCP    127.0.0.1:5037         127.0.0.1:54737        ESTABLISHED
  TCP    127.0.0.1:5037         127.0.0.1:54741        ESTABLISHED
  TCP    127.0.0.1:5354         0.0.0.0:0              LISTENING`,
						portData: `  TCP    127.0.0.1:${port}        0.0.0.0:0              LISTENING`
					}
				};

				execCalledCount++;

				let data = platformsData[platform].data;

				if (port) {
					data += `${EOL}${platformsData[platform].portData}`;
				}

				if (iteration) {
					return iteration === execCalledCount ? data : "";
				}
				return data;
			};
		};

		_.each(["linux", "darwin", "win32"], platform => {
			describe(`for ${platform}`, () => {
				it("returns true when netstat returns port is listening", async () => {
					const port = 18181;
					const testInjector = createTestInjector(platform);
					createNetStatResult(testInjector, platform, port);

					const net = testInjector.resolve<INet>(Net);
					const isPortListening = await net.waitForPortToListen({ port, timeout: 10, interval: 1 });
					assert.isTrue(isPortListening);
					assert.equal(execCalledCount, 1);
				});

				it("returns false when netstat does not return the port as not listening", async () => {
					const testInjector = createTestInjector(platform);
					createNetStatResult(testInjector, platform);

					const net = testInjector.resolve<INet>(Net);
					const isPortListening = await net.waitForPortToListen({ port: 18181, timeout: 5, interval: 1 });
					assert.isFalse(isPortListening);
					assert.isTrue(execCalledCount > 1);
				});

				it("returns true when netstat finds the port after some time", async () => {
					const port = 18181;
					const testInjector = createTestInjector(platform);
					const iterations = 2;
					createNetStatResult(testInjector, platform, port, iterations);

					const net = testInjector.resolve<INet>(Net);
					const isPortListening = await net.waitForPortToListen({ port, timeout: 10, interval: 1 });
					assert.isTrue(isPortListening);
					assert.equal(execCalledCount, iterations);
				});

				it("returns false when netstat command fails", async () => {
					const testInjector = createTestInjector(platform);
					const childProcess = testInjector.resolve<IChildProcess>("childProcess");
					const error = new Error("test error");
					childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
						execCalledCount++;
						return Promise.reject(error);
					};

					const net = testInjector.resolve<INet>(Net);
					const isPortListening = await net.waitForPortToListen({ port: 18181, timeout: 50, interval: 1 });
					assert.isFalse(isPortListening);
					assert.isTrue(execCalledCount > 1);
				});
			});
		});

		it("throws correct error when current operating system is not supported", async () => {
			const invalidPlatform = "invalid_platform";
			const testInjector = createTestInjector(invalidPlatform);

			const net = testInjector.resolve<INet>(Net);
			await assert.isRejected(net.waitForPortToListen({ port: 18181, timeout: 50, interval: 1 }), `Unable to check for free ports on ${invalidPlatform}. Supported platforms are: darwin, linux, win32`);
		});

		it("throws correct error when null is passed", async () => {
			const invalidPlatform = "invalid_platform";
			const testInjector = createTestInjector(invalidPlatform);

			const net = testInjector.resolve<INet>(Net);
			await assert.isRejected(net.waitForPortToListen(null), "You must pass port and timeout for check.");

		});
	});
});
