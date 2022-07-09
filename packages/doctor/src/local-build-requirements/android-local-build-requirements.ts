export class AndroidLocalBuildRequirements {
	constructor(
		private androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo,
		private sysInfo: NativeScriptDoctor.ISysInfo
	) {}

	public async checkRequirements(
		projectDir?: string,
		runtimeVersion?: string
	): Promise<boolean> {
		const androidToolsInfo = await this.androidToolsInfo.validateInfo({
			projectDir,
		});
		const javacVersion = await this.sysInfo.getJavaCompilerVersion();
		const isJavacVersionInvalid =
			!javacVersion ||
			(
				await this.androidToolsInfo.validateJavacVersion(
					javacVersion,
					projectDir,
					runtimeVersion
				)
			).length;
		if (
			androidToolsInfo.length ||
			!(await this.sysInfo.getAdbVersion()) ||
			isJavacVersionInvalid
		) {
			return false;
		}

		return true;
	}
}
