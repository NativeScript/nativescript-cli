import * as path from "path";
import { sysInfo } from "nativescript-doctor";

export class SysInfo implements ISysInfo {
	private sysInfo: ISysInfoData = null;

	public async getSysInfo(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.ISysInfoData> {
		if (!this.sysInfo) {
			const pathToNativeScriptCliPackageJson = (config && config.pathToNativeScriptCliPackageJson) || path.join(__dirname, "..", "package.json");
			const androidToolsInfo = config && config.androidToolsInfo;

			this.sysInfo = await sysInfo.getSysInfo({pathToNativeScriptCliPackageJson, androidToolsInfo});
		}

		return this.sysInfo;
	}

	public getXcodeVersion(): Promise<string> {
		return sysInfo.getXcodeVersion();
	}

	public getCocoaPodsVersion(): Promise<string> {
		return sysInfo.getCocoaPodsVersion();
	}

	public getJavaCompilerVersion(): Promise<string> {
		return sysInfo.getJavaCompilerVersion();
	}
}
$injector.register("sysInfo", SysInfo);
