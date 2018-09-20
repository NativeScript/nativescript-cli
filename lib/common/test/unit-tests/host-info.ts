import { Yok } from "../../yok";
import { HostInfo } from "../../host-info";
import { ErrorsStub, CommonLoggerStub } from "./stubs";
import { assert } from "chai";

// Use custom class as isDarwin has only getter in HostInfo, while for current tests we need to set it to true or false.
class MockHostInfo extends HostInfo {
	private _isDarwin: boolean;

	public get isDarwin(): boolean {
		return this._isDarwin;
	}

	public set isDarwin(value: boolean) {
		this._isDarwin = value;
	}

	constructor($errors: IErrors, $injector: IInjector) {
		super($errors, $injector);
	}
}

describe("hostInfo", () => {
	describe("getMacOSVersion", () => {
		const createTestInjector = (): IInjector => {
			const testInjector = new Yok();
			testInjector.register("injector", testInjector);
			testInjector.register("errors", ErrorsStub);
			testInjector.register("osInfo", {});
			testInjector.register("logger", CommonLoggerStub);
			testInjector.register("childProcess", {});
			testInjector.register("hostInfo", MockHostInfo);
			testInjector.resolve("hostInfo").isDarwin = true;

			return testInjector;
		};

		it("returns null when os is not macOS", async () => {
			const testInjector = createTestInjector();
			const hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			hostInfo.isDarwin = false;

			const macOSVersion = await hostInfo.getMacOSVersion();
			assert.deepEqual(macOSVersion, null);
		});

		it("returns correct macOS version based on system_profile", async () => {
			const testInjector = createTestInjector();
			const hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			let calledCommand = "";
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				calledCommand = command;
				return `Software:

    System Software Overview:

      System Version: macOS 10.13.3 (17D47)
      Kernel Version: Darwin 17.4.0
      Time since boot: 68 days 22:12`;
			};

			const macOSVersion = await hostInfo.getMacOSVersion();
			assert.deepEqual(macOSVersion, "10.13");
			assert.equal(calledCommand, "system_profiler SPSoftwareDataType -detailLevel mini");
		});

		it("returns correct macOS version when system_profile call throws", async () => {
			const testInjector = createTestInjector();
			const hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				throw new Error("Err");
			};

			const osInfo = testInjector.resolve<IOsInfo>("osInfo");
			osInfo.release = (): string => "17.4.0";
			const macOSVersion = await hostInfo.getMacOSVersion();
			assert.deepEqual(macOSVersion, "10.13");
		});

		it("returns correct macOS version when system_profile call returns data that does not match our RegExp", async () => {
			const testInjector = createTestInjector();
			const hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				return "Non-matching data";
			};

			const osInfo = testInjector.resolve<IOsInfo>("osInfo");
			osInfo.release = (): string => "17.4.0";
			const macOSVersion = await hostInfo.getMacOSVersion();
			assert.deepEqual(macOSVersion, "10.13");
		});
	});
});
