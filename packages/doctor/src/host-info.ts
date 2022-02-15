import { WinReg } from "./winreg";

export class HostInfo {
	private static WIN32_NAME = "win32";
	private static PROCESSOR_ARCHITEW6432 = "PROCESSOR_ARCHITEW6432";
	private static DARWIN_OS_NAME = "darwin";
	private static LINUX_OS_NAME = "linux";
	private static DOT_NET_REGISTRY_PATH =
		"\\Software\\Microsoft\\NET Framework Setup\\NDP\\v4\\Client";

	constructor(private winreg: WinReg) {}

	public get isWindows(): boolean {
		return process.platform === HostInfo.WIN32_NAME;
	}

	public get isWindows64(): boolean {
		return (
			this.isWindows &&
			(this.isNode64Bit ||
				process.env.hasOwnProperty(HostInfo.PROCESSOR_ARCHITEW6432))
		);
	}

	public get isWindows32() {
		return this.isWindows && !this.isWindows64;
	}

	public get isDarwin(): boolean {
		return process.platform === HostInfo.DARWIN_OS_NAME;
	}

	public get isLinux(): boolean {
		return process.platform === HostInfo.LINUX_OS_NAME;
	}

	public get isNode64Bit(): boolean {
		return process.arch === "x64";
	}

	public dotNetVersion(): Promise<string> {
		if (this.isWindows) {
			return this.winreg.getRegistryValue(
				"Version",
				this.winreg.registryKeys.HKLM,
				HostInfo.DOT_NET_REGISTRY_PATH
			);
		} else {
			return Promise.resolve(null);
		}
	}
}
