import { HostInfo } from "../host-info";

export class IosLocalBuildRequirements {
	constructor(private sysInfo: NativeScriptDoctor.ISysInfo,
		private hostInfo: HostInfo) { }

	public async checkRequirements(): Promise<boolean> {
		if (!this.hostInfo.isDarwin ||
			!await this.sysInfo.getXcodeVersion() ||
			!await this.sysInfo.getXcodeprojLocation()) {
			return false;
		}

		return true;
	}
}
