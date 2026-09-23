import { join } from "path";
import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";
import { AndroidBundleToolService } from "../../lib/services/android/android-bundle-tool-service";
import { IAndroidBundleToolService } from "../../lib/definitions/android-bundle-tool-service";
import {
	ErrorsStub,
	FileSystemStub,
	LoggerStub,
	TerminalSpinnerServiceStub,
} from "../stubs";
import {
	BUNDLETOOL_PATH_ENV_VAR,
	BUNDLETOOL_SHA256,
	BUNDLETOOL_VERSION,
} from "../../lib/constants";

describe("androidBundleToolService", () => {
	const profileDir = join("/", "profile");
	const cacheDir = join(profileDir, "bundletool");
	const jarPath = join(cacheDir, `bundletool-all-${BUNDLETOOL_VERSION}.jar`);
	const tempPath = `${jarPath}.download`;
	const deviceId = "emulator-5554";

	let originalEnvValue: string;

	beforeEach(() => {
		originalEnvValue = process.env[BUNDLETOOL_PATH_ENV_VAR];
		delete process.env[BUNDLETOOL_PATH_ENV_VAR];
	});

	afterEach(() => {
		if (originalEnvValue === undefined) {
			delete process.env[BUNDLETOOL_PATH_ENV_VAR];
		} else {
			process.env[BUNDLETOOL_PATH_ENV_VAR] = originalEnvValue;
		}
	});

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("childProcess", {
			spawnedArgs: <string[]>null,
			trySpawnFromCloseEvent(command: string, args: string[]) {
				this.spawnedArgs = args;
				return Promise.resolve({ exitCode: 0, stdout: "", stderr: "" });
			},
		});
		testInjector.register("sysInfo", {
			getJavaPath: async () => "java",
		});
		testInjector.register("errors", ErrorsStub);
		testInjector.register("fs", FileSystemStub);
		testInjector.register("httpClient", {
			requests: <any[]>[],
			async httpRequest(options: any) {
				this.requests.push(options);
				return {};
			},
		});
		testInjector.register("lockService", {
			lockedActions: 0,
			executeActionWithLock<T>(action: () => Promise<T>): Promise<T> {
				this.lockedActions++;
				return action();
			},
		});
		testInjector.register("logger", LoggerStub);
		testInjector.register("settingsService", {
			getProfileDir: () => profileDir,
		});
		testInjector.register("terminalSpinnerService", TerminalSpinnerServiceStub);
		testInjector.register("androidBundleToolService", AndroidBundleToolService);

		return testInjector;
	};

	// the jar path is resolved lazily on the first bundletool invocation, so the
	// arguments handed to java are what the resolution actually produced
	const getJarPassedToJava = (testInjector: IInjector): string => {
		const childProcess = testInjector.resolve<any>("childProcess");
		const jarFlagIndex = childProcess.spawnedArgs.indexOf("-jar");

		return childProcess.spawnedArgs[jarFlagIndex + 1];
	};

	const installApks = (testInjector: IInjector): Promise<void> => {
		const service = testInjector.resolve<IAndroidBundleToolService>(
			"androidBundleToolService",
		);

		return service.installApks({ apksFilePath: "my.apks", deviceId });
	};

	describe("resolving bundletool", () => {
		it("uses the jar pointed at by the env var without downloading", async () => {
			const customPath = join("/", "opt", "bundletool.jar");
			process.env[BUNDLETOOL_PATH_ENV_VAR] = customPath;
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<any>("httpClient");

			await installApks(testInjector);

			assert.equal(getJarPassedToJava(testInjector), customPath);
			assert.lengthOf(httpClient.requests, 0);
		});

		it("fails when the env var points at a missing file", async () => {
			const customPath = join("/", "opt", "missing.jar");
			process.env[BUNDLETOOL_PATH_ENV_VAR] = customPath;
			const testInjector = createTestInjector();
			const fs = testInjector.resolve<FileSystemStub>("fs");
			fs.exists = () => false;

			await assert.isRejected(
				installApks(testInjector),
				`${BUNDLETOOL_PATH_ENV_VAR} is set to "${customPath}", but no file exists there.`,
			);
		});

		it("reuses the cached jar when its checksum matches", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<any>("httpClient");
			const fs = testInjector.resolve<FileSystemStub>("fs");
			fs.exists = (path: string) => path === jarPath;
			fs.getFileShasum = async () => BUNDLETOOL_SHA256;

			await installApks(testInjector);

			assert.equal(getJarPassedToJava(testInjector), jarPath);
			assert.lengthOf(httpClient.requests, 0);
		});

		it("resolves the jar only once across multiple invocations", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve<FileSystemStub>("fs");
			let shasumCalls = 0;
			fs.exists = (path: string) => path === jarPath;
			fs.getFileShasum = async () => {
				shasumCalls++;
				return BUNDLETOOL_SHA256;
			};

			await installApks(testInjector);
			await installApks(testInjector);

			assert.equal(shasumCalls, 1);
		});
	});

	describe("downloading bundletool", () => {
		it("downloads, verifies and atomically moves the jar into the cache", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<any>("httpClient");
			const fs = testInjector.resolve<FileSystemStub>("fs");
			const renames: { from: string; to: string }[] = [];
			fs.exists = () => false;
			fs.getFileShasum = async () => BUNDLETOOL_SHA256;
			fs.rename = (from: string, to: string) => {
				renames.push({ from, to });
			};

			await installApks(testInjector);

			assert.lengthOf(httpClient.requests, 1);
			assert.equal(
				httpClient.requests[0].url,
				`https://github.com/google/bundletool/releases/download/${BUNDLETOOL_VERSION}/bundletool-all-${BUNDLETOOL_VERSION}.jar`,
			);
			assert.deepEqual(renames, [{ from: tempPath, to: jarPath }]);
			assert.equal(getJarPassedToJava(testInjector), jarPath);
		});

		it("takes the lock and re-checks the cache before downloading", async () => {
			const testInjector = createTestInjector();
			const lockService = testInjector.resolve<any>("lockService");
			const httpClient = testInjector.resolve<any>("httpClient");
			const fs = testInjector.resolve<FileSystemStub>("fs");
			// absent when first checked, present by the time the lock is acquired,
			// as if another process downloaded it while this one waited
			let existsCalls = 0;
			fs.exists = () => existsCalls++ > 0;
			fs.getFileShasum = async () => BUNDLETOOL_SHA256;

			await installApks(testInjector);

			assert.equal(lockService.lockedActions, 1);
			assert.lengthOf(httpClient.requests, 0);
			assert.equal(getJarPassedToJava(testInjector), jarPath);
		});

		it("deletes the partial download and fails on a checksum mismatch", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve<FileSystemStub>("fs");
			fs.exists = () => false;
			fs.getFileShasum = async () => "deadbeef";

			await assert.isRejected(
				installApks(testInjector),
				/Checksum mismatch for bundletool/,
			);
			assert.include(fs.deletedFiles, tempPath);
		});

		it("deletes the partial download and points at the env var when the download fails", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve<FileSystemStub>("fs");
			const httpClient = testInjector.resolve<any>("httpClient");
			fs.exists = () => false;
			httpClient.httpRequest = async () => {
				throw new Error("socket hang up");
			};

			await assert.isRejected(
				installApks(testInjector),
				new RegExp(
					`Unable to download bundletool.*${BUNDLETOOL_PATH_ENV_VAR}.*socket hang up`,
				),
			);
			assert.include(fs.deletedFiles, tempPath);
		});

		it("discards a cached jar whose checksum no longer matches", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<any>("httpClient");
			const fs = testInjector.resolve<FileSystemStub>("fs");
			const shasums = ["tampered", "tampered", BUNDLETOOL_SHA256];
			fs.exists = () => shasums.length > 1;
			fs.getFileShasum = async () => shasums.shift();

			await installApks(testInjector);

			assert.include(fs.deletedFiles, jarPath);
			assert.lengthOf(httpClient.requests, 1);
		});
	});
});
