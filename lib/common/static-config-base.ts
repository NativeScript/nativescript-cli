import * as path from "path";
import * as shelljs from "shelljs";
import * as os from "os";

export abstract class StaticConfigBase implements Config.IStaticConfig {
	public PROJECT_FILE_NAME: string = null;
	public CLIENT_NAME: string = null;
	public ANALYTICS_API_KEY: string = null;
	public abstract ANALYTICS_EXCEPTIONS_API_KEY: string;
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME: string = null;
	public TRACK_FEATURE_USAGE_SETTING_NAME: string = null;
	public ERROR_REPORT_SETTING_NAME: string = null;
	public APP_RESOURCES_DIR_NAME = "App_Resources";
	public COMMAND_HELP_FILE_NAME = 'command-help.json';
	public QR_SIZE = 5;
	public RESOURCE_DIR_PATH = __dirname;
	public SYS_REQUIREMENTS_LINK: string;
	public HTML_CLI_HELPERS_DIR: string;
	public version: string = null;
	public pathToPackageJson: string;
	private _userAgent: string = null;
	public abstract PROFILE_DIR_NAME: string;

	public get USER_AGENT_NAME(): string {
		if (!this._userAgent) {
			this._userAgent = `${this.CLIENT_NAME}CLI`;
		}

		return this._userAgent;
	}

	public set USER_AGENT_NAME(userAgentName: string) {
		this._userAgent = userAgentName;
	}

	protected _adbFilePath: string = null;

	constructor(protected $injector: IInjector) { }

	public async getAdbFilePath(): Promise<string> {
		if (!this._adbFilePath) {
			this._adbFilePath = await this.getAdbFilePathCore();
		}

		return this._adbFilePath;
	}

	public get MAN_PAGES_DIR(): string {
		return path.join(__dirname, "../../", "docs", "man_pages");
	}

	public get HTML_PAGES_DIR(): string {
		return path.join(__dirname, "../../", "docs", "html");
	}

	public get HTML_COMMON_HELPERS_DIR(): string {
		return path.join(__dirname, "docs", "helpers");
	}

	private async getAdbFilePathCore(): Promise<string> {
		const $childProcess: IChildProcess = this.$injector.resolve("$childProcess");

		try {
			// Do NOT use the adb wrapper because it will end blow up with Segmentation fault because the wrapper uses this method!!!
			const proc = await $childProcess.spawnFromEvent("adb", ["version"], "exit", undefined, { throwError: false });

			if (proc.stderr) {
				return await this.spawnPrivateAdb();
			}
		} catch (e) {
			if (e.code === "ENOENT") {
				return await this.spawnPrivateAdb();
			}
		}

		return "adb";
	}

	/*
		Problem:
		1. Adb forks itself as a server which keeps running until adb kill-server is invoked or crashes
		2. On Windows running processes lock their image files due to memory mapping. Locked files prevent their parent directories from deletion and cannot be overwritten.
		3. Update and uninstall scenarios are broken
		Solution:
		- Copy adb and associated files into a temporary directory. Let this copy of adb run persistently
		- On Posix OSes, immediately delete the file to not take file space
		- Tie common lib version to updates of adb, so that when we integrate a newer adb we can use it
		- Adb is named differently on OSes and may have additional files. The code is hairy to accommodate these differences
	 */
	private async spawnPrivateAdb(): Promise<string> {
		const $fs: IFileSystem = this.$injector.resolve("$fs"),
			$childProcess: IChildProcess = this.$injector.resolve("$childProcess"),
			$hostInfo: IHostInfo = this.$injector.resolve("$hostInfo");

		// prepare the directory to host our copy of adb
		const defaultAdbDirPath = path.join(__dirname, `resources/platform-tools/android/${process.platform}`);
		const commonLibVersion = require(path.join(__dirname, "package.json")).version;
		const tmpDir = path.join(os.tmpdir(), `telerik-common-lib-${commonLibVersion}`);
		$fs.createDirectory(tmpDir);

		// copy the adb and associated files
		const targetAdb = path.join(tmpDir, "adb");

		// In case directory is missing or it's empty, copy the new adb
		if (!$fs.exists(tmpDir) || !$fs.readDirectory(tmpDir).length) {
			shelljs.cp(path.join(defaultAdbDirPath, "*"), tmpDir); // deliberately ignore copy errors
			// adb loses its executable bit when packed inside electron asar file. Manually fix the issue
			if (!$hostInfo.isWindows) {
				shelljs.chmod("+x", targetAdb);
			}
		}

		// let adb start its global server
		await $childProcess.spawnFromEvent(targetAdb, ["start-server"], "exit");

		return targetAdb;
	}

	public PATH_TO_BOOTSTRAP: string;
}
