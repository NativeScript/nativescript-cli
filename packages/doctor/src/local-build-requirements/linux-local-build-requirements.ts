import { Constants } from "../constants";
import { HostInfo } from "../host-info";

export class LinuxLocalBuildRequirements {
	constructor(
		private sysInfo: NativeScriptDoctor.ISysInfo,
		private hostInfo: HostInfo,
	) {}

	public async checkRequirements(): Promise<boolean> {
		if (!this.hostInfo.isLinux) {
			return false;
		}
		const sysInfoData = await this.sysInfo.getSysInfo({
			platform: Constants.LINUX_PLATFORM_NAME,
		});
		return !!sysInfoData.isGtk4Installed;
	}
}
