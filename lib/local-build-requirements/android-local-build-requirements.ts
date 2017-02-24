export class AndroidLocalBuildRequirements {
	constructor(private sysInfo: NativeScriptDoctor.ISysInfo) { }

	public async checkRequirements(): Promise<boolean> {
		if (!await this.sysInfo.isAndroidInstalled() ||
			!await this.sysInfo.getJavaCompilerVersion() ||
			!await this.sysInfo.getJavaVersion() ||
			!await this.sysInfo.getAdbVersion()) {
			return false;
		}

		return true;
	}
}
