import * as path from "path";
import { cache } from "../decorators";
import { IHostInfo, IErrors, IXcodeSelectService, IChildProcess, IVersionData, ISysInfo } from "../declarations";
import { IInjector } from "../definitions/yok";
import { injector } from "../yok";

export class XcodeSelectService implements IXcodeSelectService {
	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector) {
	}

	public async getDeveloperDirectoryPath(): Promise<string> {
		if (!this.$hostInfo.isDarwin) {
			this.$errors.fail("xcode-select is only available on Mac OS X.");
		}

		const childProcess = await this.$childProcess.spawnFromEvent("xcode-select", ["-print-path"], "close", {}, { throwError: false }),
			result = childProcess.stdout.trim();

		if (!result) {
			this.$errors.fail("Cannot find path to Xcode.app - make sure you've installed Xcode correctly.");
		}

		return result;
	}

	public async getContentsDirectoryPath(): Promise<string> {
		return path.join(await this.getDeveloperDirectoryPath(), "..");
	}

	@cache()
	public async getXcodeVersion(): Promise<IVersionData> {
		const sysInfo = this.$injector.resolve<ISysInfo>("sysInfo");
		const xcodeVer = await sysInfo.getXcodeVersion();
		if (!xcodeVer) {
			this.$errors.fail("xcodebuild execution failed. Make sure that you have latest Xcode and tools installed.");
		}

		const [ major, minor, patch ] = xcodeVer.split(".");

		return { major, minor, patch };
	}
}

injector.register("xcodeSelectService", XcodeSelectService);
