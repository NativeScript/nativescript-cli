import { cache } from "./decorators";

export class HostInfo implements IHostInfo {
	private static WIN32_NAME = "win32";
	private static PROCESSOR_ARCHITEW6432 = "PROCESSOR_ARCHITEW6432";
	private static DARWIN_OS_NAME = "darwin";
	private static LINUX_OS_NAME = "linux";
	private static DOT_NET_REGISTRY_PATH = "\\Software\\Microsoft\\NET Framework Setup\\NDP\\v4\\Client";

	private get $childProcess(): IChildProcess {
		return this.$injector.resolve("childProcess");
	}

	private get $osInfo(): IOsInfo {
		return this.$injector.resolve("osInfo");
	}

	private get $logger(): ILogger {
		return this.$injector.resolve("logger");
	}

	constructor(private $errors: IErrors,
		private $injector: IInjector) { }

	public get isWindows() {
		return process.platform === HostInfo.WIN32_NAME;
	}

	public get isWindows64() {
		return this.isWindows && (process.arch === "x64" || process.env.hasOwnProperty(HostInfo.PROCESSOR_ARCHITEW6432));
	}

	public get isWindows32() {
		return this.isWindows && !this.isWindows64;
	}

	public get isDarwin() {
		return process.platform === HostInfo.DARWIN_OS_NAME;
	}

	public get isLinux() {
		return process.platform === HostInfo.LINUX_OS_NAME;
	}

	public get isLinux64(): boolean {
		return this.isLinux && process.config.variables.host_arch === "x64";
	}

	@cache()
	public async getMacOSVersion(): Promise<string> {
		if (!this.isDarwin) {
			return null;
		}

		const systemProfileCommand = "system_profiler SPSoftwareDataType -detailLevel mini";
		this.$logger.trace("Trying to get macOS version.");
		try {
			const systemProfileOutput = await this.$childProcess.exec(systemProfileCommand);

			// Output of command is similar to:
			/*
Software:

    System Software Overview:

      System Version: macOS 10.13.3 (17D47)
      Kernel Version: Darwin 17.4.0
      Time since boot: 68 days 22:12
*/
			const versionRegExp = /System Version:\s+?macOS\s+?(\d+\.\d+)\.\d+\s+/g;
			const regExpMatchers = versionRegExp.exec(systemProfileOutput);
			const macOSVersion = regExpMatchers && regExpMatchers[1];
			if (macOSVersion) {
				this.$logger.trace(`macOS version based on system_profiler is ${macOSVersion}.`);
				return macOSVersion;
			}

			this.$logger.trace(`Unable to get macOS version from ${systemProfileCommand} output.`);
		} catch (err) {
			this.$logger.trace(`Unable to get macOS version from ${systemProfileCommand}. Error is: ${err}`);
		}

		// https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
		// Each macOS version is labeled 10.<version>, where it looks like <versions> is taken from the major version returned by os.release() (16.x.x for example) and subtracting 4 from it.
		// So the version becomes "10.12" in this case.
		const osRelease = this.$osInfo.release();
		const majorVersion = osRelease && _.first(osRelease.split("."));
		const macOSVersion = majorVersion && `10.${+majorVersion - 4}`;
		this.$logger.trace(`macOS version based on os.release() (${osRelease}) is ${macOSVersion}.`);
		return macOSVersion;
	}

	public dotNetVersion(): Promise<string> {
		if (this.isWindows) {
			return new Promise<string>((resolve, reject) => {
				const Winreg = require("winreg");
				const regKey = new Winreg({
					hive: Winreg.HKLM,
					key: HostInfo.DOT_NET_REGISTRY_PATH
				});
				regKey.get("Version", (err: Error, value: any) => {
					if (err) {
						reject(err);
					} else {
						resolve(value.value);
					}
				});
			});
		} else {
			return Promise.resolve<string>(null);
		}
	}

	public async isDotNet40Installed(message?: string): Promise<boolean> {
		if (this.isWindows) {
			try {
				await this.dotNetVersion();
				return true;
			} catch (e) {
				this.$errors.failWithoutHelp(message || "An error occurred while reading the registry.");
			}
		} else {
			return false;
		}
	}
}
$injector.register("hostInfo", HostInfo);
