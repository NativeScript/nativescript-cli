export class AndroidLocalBuildRequirements {
	constructor(private androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo,
		private sysInfo: NativeScriptDoctor.ISysInfo) { }

	public async checkRequirements(): Promise<boolean> {
		const androidToolsInfo = await this.androidToolsInfo.validateInfo();
		if (androidToolsInfo.length ||
			!await this.sysInfo.getJavaCompilerVersion() ||
			!await this.sysInfo.getAdbVersion()) {
			return false;
		}

		return true;
	}
}
