import { HostInfo } from "../host-info";
import * as semver from "semver";
import { Constants } from "../constants";

export class IosLocalBuildRequirements {
	constructor(
		private sysInfo: NativeScriptDoctor.ISysInfo,
		private hostInfo: HostInfo
	) {}

	public async checkRequirements(): Promise<boolean> {
		if (
			!this.hostInfo.isDarwin ||
			!(await this.isXcodeVersionValid()) ||
			!(await this.sysInfo.getXcodeprojLocation())
		) {
			return false;
		}

		return true;
	}

	public async isXcodeVersionValid(): Promise<boolean> {
		const xcodeVersion = await this.sysInfo.getXcodeVersion();

		return (
			!!xcodeVersion &&
			semver.major(semver.coerce(xcodeVersion)) >=
				Constants.XCODE_MIN_REQUIRED_VERSION
		);
	}
}
