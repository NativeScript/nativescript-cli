import { SysInfo } from "../sys-info";
import { HostInfo } from "../host-info";

export class IosLocalBuildRequirements {
	constructor(private sysInfo: SysInfo,
		private hostInfo: HostInfo) { }

	public async checkRequirements(): Promise<boolean> {
		if (!this.hostInfo.isDarwin ||
			!await this.sysInfo.getXCodeVersion() ||
			!await this.sysInfo.getXCodeProjGemLocation()) {
			return false;
		}

		return true;
	}
}
