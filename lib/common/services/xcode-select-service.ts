import * as path from "path";
import { cache } from "../decorators";

export class XcodeSelectService implements IXcodeSelectService {
	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector) {
	}

	public async getDeveloperDirectoryPath(): Promise<string> {
		if (!this.$hostInfo.isDarwin) {
			this.$errors.failWithoutHelp("xcode-select is only available on Mac OS X.");
		}

		const childProcess = await this.$childProcess.spawnFromEvent("xcode-select", ["-print-path"], "close", {}, { throwError: false }),
			result = childProcess.stdout.trim();

		if (!result) {
			this.$errors.failWithoutHelp("Cannot find path to Xcode.app - make sure you've installed Xcode correctly.");
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
			this.$errors.failWithoutHelp("xcodebuild execution failed. Make sure that you have latest Xcode and tools installed.");
		}

		const xcodeVersionMatch = xcodeVer.match(/Xcode (.*)/),
			xcodeVersionGroup = xcodeVersionMatch && xcodeVersionMatch[1],
			xcodeVersionSplit = xcodeVersionGroup && xcodeVersionGroup.split(".");

		return {
			major: xcodeVersionSplit && xcodeVersionSplit[0],
			minor: xcodeVersionSplit && xcodeVersionSplit[1],
			patch: xcodeVersionSplit && xcodeVersionSplit[2]
		};
	}
}

$injector.register("xcodeSelectService", XcodeSelectService);
