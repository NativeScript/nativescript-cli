import { Yok } from "../../yok";
import { XcodeSelectService } from "../../services/xcode-select-service";
import { assert } from "chai";
import * as path from "path";

let executionStopped = false;

function createTestInjector(config: { xcodeSelectStdout: string, isDarwin: boolean, xcodeVersionOutput?: string }): IInjector {
	const testInjector = new Yok();
	testInjector.register("childProcess", {
		spawnFromEvent: (command: string, args: string[], event: string): Promise<any> => Promise.resolve({
			stdout: config.xcodeSelectStdout
		})
	});
	testInjector.register("sysInfo", {
		getSysInfo: (pathToPackageJson: string, androidToolsInfo?: { pathToAdb: string, pathToAndroid: string }) => {
			return Promise.resolve({
				xcodeVer: config.xcodeVersionOutput
			});
		},
		getXcodeVersion: () => {
			return Promise.resolve(config.xcodeVersionOutput);
		}
	});
	testInjector.register("errors", {
		failWithoutHelp: (message: string, ...args: any[]): void => { executionStopped = true; }
	});

	testInjector.register("hostInfo", {
		isDarwin: config.isDarwin
	});
	testInjector.register("xcodeSelectService", XcodeSelectService);

	return testInjector;
}
describe("xcode-select-service", () => {
	let injector: IInjector;
	let service: IXcodeSelectService;
	const defaultXcodeSelectStdout = "/Applications/Xcode.app/Contents/Developer/";

	beforeEach(() => {
		executionStopped = false;
	});

	it("gets correct path to Developer directory on Mac OS X whitout whitespaces", async () => {
		injector = createTestInjector({ xcodeSelectStdout: "  /Applications/Xcode.app/Contents/Developer/  ", isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		assert.deepEqual(await service.getDeveloperDirectoryPath(), defaultXcodeSelectStdout, "xcode-select service should get correct trimmed  path to Developer directory on Mac OS X.");
	});

	it("gets correct path to Developer directory on Mac OS X whitout new lines", async () => {
		injector = createTestInjector({ xcodeSelectStdout: "\r\n/Applications/Xcode.app/Contents/Developer/\n", isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		assert.deepEqual(await service.getDeveloperDirectoryPath(), defaultXcodeSelectStdout, "xcode-select service should get correct trimmed  path to Developer directory on Mac OS X.");
	});

	it("gets correct Xcode version", async () => {
		injector = createTestInjector({ xcodeSelectStdout: null, isDarwin: true, xcodeVersionOutput: "Xcode 7.3\nBuild version 7D175" });
		service = injector.resolve("$xcodeSelectService");

		const xcodeVersion = await service.getXcodeVersion();

		assert.strictEqual(xcodeVersion.major, "7", "xcodeSelectService should get correct Xcode version");
		assert.strictEqual(xcodeVersion.minor, "3", "xcodeSelectService should get correct Xcode version");
	});

	it("gets correct path to Developer directory on Mac OS X", async () => {
		injector = createTestInjector({ xcodeSelectStdout: defaultXcodeSelectStdout, isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		assert.deepEqual(await service.getDeveloperDirectoryPath(), defaultXcodeSelectStdout, "xcode-select service should get correct path to Developer directory on Mac OS X.");
	});

	it("gets correct path to Contents directory on Mac OS X", async () => {
		// This path is constructed with path.join so that the tests are OS-agnostic
		const expected = path.join("/Applications", "Xcode.app", "Contents");
		injector = createTestInjector({ xcodeSelectStdout: defaultXcodeSelectStdout, isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		assert.deepEqual(await service.getContentsDirectoryPath(), expected, "xcode-select service should get correct path to Contents directory on Mac OS X.");
	});

	it("stops execution when trying to get Developer directory if not on Mac OS X", async () => {
		injector = createTestInjector({ xcodeSelectStdout: defaultXcodeSelectStdout, isDarwin: false });
		service = injector.resolve("$xcodeSelectService");

		await service.getDeveloperDirectoryPath();

		assert.deepEqual(executionStopped, true, "xcode-select service should stop executon unless on Mac OS X.");
	});

	it("stops execution when trying to get Contents directory if not on Mac OS X", async () => {
		injector = createTestInjector({ xcodeSelectStdout: defaultXcodeSelectStdout, isDarwin: false });
		service = injector.resolve("$xcodeSelectService");

		await service.getContentsDirectoryPath();

		assert.deepEqual(executionStopped, true, "xcode-select service should stop executon unless on Mac OS X.");
	});

	it("stops execution when Developer directory is empty on Mac OS X", async () => {
		injector = createTestInjector({ xcodeSelectStdout: "", isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		await service.getDeveloperDirectoryPath();

		assert.deepEqual(executionStopped, true, "xcode-select service should stop executon when Developer directory is empty on Mac OS X.");
	});

	it("stops execution when Contents directory is empty on Mac OS X", async () => {
		injector = createTestInjector({ xcodeSelectStdout: "", isDarwin: true });
		service = injector.resolve("$xcodeSelectService");

		await service.getContentsDirectoryPath();

		assert.deepEqual(executionStopped, true, "xcode-select service should stop executon when Contents directory is empty on Mac OS X.");
	});
});
