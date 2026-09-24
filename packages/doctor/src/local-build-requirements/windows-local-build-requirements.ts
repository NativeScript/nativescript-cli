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
		return !!(sysInfoData.dotNetSdkVer && sysInfoData.windowsAppSdkWorkloadInstalled);
	}
}
