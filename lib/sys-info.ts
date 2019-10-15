import * as path from "path";
import { format } from "util";
import { sysInfo } from "nativescript-doctor";
import { MacOSVersions, MacOSDeprecationStringFormat } from "./constants";
import { getNodeWarning } from "./common/verify-node-version";
import { exported } from "./common/decorators";

export class SysInfo implements ISysInfo {
	private sysInfo: ISysInfoData = null;

	constructor(private $fs: IFileSystem,
		private $hostInfo: IHostInfo) { }

	public async getSysInfo(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.ISysInfoData> {
		if (!this.sysInfo) {
			const pathToNativeScriptCliPackageJson = (config && config.pathToNativeScriptCliPackageJson) || path.join(__dirname, "..", "package.json");
			const androidToolsInfo = config && config.androidToolsInfo;

			this.sysInfo = await sysInfo.getSysInfo({ pathToNativeScriptCliPackageJson, androidToolsInfo });
		}

		return this.sysInfo;
	}

	public getXcodeVersion(): Promise<string> {
		return sysInfo.getXcodeVersion();
	}

	public getCocoaPodsVersion(): Promise<string> {
		return sysInfo.getCocoaPodsVersion();
	}

	public getJavaPath(): Promise<string> {
		return sysInfo.getJavaPath();
	}

	public getJavaCompilerVersion(): Promise<string> {
		return sysInfo.getJavaCompilerVersion();
	}

	public getJavaVersionFromPath(): Promise<string> {
		return sysInfo.getJavaVersionFromPath();
	}

	public getJavaVersionFromJavaHome(): Promise<string> {
		return sysInfo.getJavaVersionFromJavaHome();
	}

	@exported("sysInfo")
	public async getSystemWarnings(): Promise<ISystemWarning[]> {
		const warnings: ISystemWarning[] = [];
		const macOSWarningMessage = await this.getMacOSWarningMessage();
		if (macOSWarningMessage) {
			macOSWarningMessage.toString = function () { return this.message; };
			warnings.push(macOSWarningMessage);
		}

		const nodeWarning = getNodeWarning();
		if (nodeWarning) {
			nodeWarning.toString = function () { return this.message; };
			warnings.push(nodeWarning);
		}

		return warnings;
	}

	@exported("sysInfo")
	public getSupportedNodeVersionRange(): string {
		const pathToCLIPackageJson = path.join(__dirname, "..", "package.json");
		const jsonContent = this.$fs.readJson(pathToCLIPackageJson);
		return jsonContent && jsonContent.engines && jsonContent.engines.node;
	}

	public async getMacOSWarningMessage(): Promise<ISystemWarning> {
		const macOSVersion = await this.$hostInfo.getMacOSVersion();
		if (macOSVersion && macOSVersion < MacOSVersions.HighSierra) {
			return {
				message: format(MacOSDeprecationStringFormat, macOSVersion),
				severity: SystemWarningsSeverity.high
			};
		}

		return null;
	}
}
$injector.register("sysInfo", SysInfo);
