import * as semver from "semver";
import { Constants } from "../constants";
import { HostInfo } from "../host-info";

export class WindowsLocalBuildRequirements {
	constructor(
		private sysInfo: NativeScriptDoctor.ISysInfo,
		private hostInfo: HostInfo,
	) {}

	public async checkRequirements(): Promise<boolean> {
		if (!this.hostInfo.isWindows) {
			return false;
		}
		const sysInfoData = await this.sysInfo.getSysInfo({
			platform: Constants.WINDOWS_PLATFORM_NAME,
		});
		// Developer Mode is only needed to run, not to build.
		return (
			!!sysInfoData.dotNetSdkVer &&
			semver.major(sysInfoData.dotNetSdkVer) >=
				Constants.DOTNET_SDK_MIN_REQUIRED_VERSION
		);
	}
}
