import * as path from "path";
import * as shelljs from "shelljs";
import * as os from "os";

export class Configuration implements IConfiguration { // User specific config
	DEBUG = false;
	ANDROID_DEBUG_UI: string = null;
	USE_POD_SANDBOX: boolean = false;
	UPLOAD_PLAYGROUND_FILES_ENDPOINT: string = null;
	SHORTEN_URL_ENDPOINT: string = null;
	INSIGHTS_URL_ENDPOINT: string = null;
	WHOAMI_URL_ENDPOINT: string = null;
	PREVIEW_APP_ENVIRONMENT: string = null;
	GA_TRACKING_ID: string = null;
	DISABLE_HOOKS: boolean = false;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(private $fs: IFileSystem) {
		_.extend(this, this.loadConfig("config"));
	}

	private loadConfig(name: string): any {
		const configFileName = this.getConfigPath(name);
		return this.$fs.readJson(configFileName);
	}

	private getConfigPath(filename: string): string {
		return path.join(__dirname, "../config", filename + ".json");
	}
}
$injector.register("config", Configuration);

export class StaticConfig implements IStaticConfig {
	public QR_SIZE = 5;
	public PROJECT_FILE_NAME = "package.json";
	public CLIENT_NAME_KEY_IN_PROJECT_FILE = "nativescript";
	public CLIENT_NAME = "tns";
	public CLIENT_NAME_ALIAS = "NativeScript";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "TrackFeatureUsage";
	public ERROR_REPORT_SETTING_NAME = "TrackExceptions";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public get PROFILE_DIR_NAME(): string {
		return ".nativescript-cli";
	}
	public RESOURCE_DIR_PATH = path.join(__dirname, "..", "resources");

	constructor(private $injector: IInjector) {
	}

	public get disableCommandHooks() {
		// Never set this to false because it will duplicate execution of hooks realized through method decoration
		return true;
	}

	public get SYS_REQUIREMENTS_LINK(): string {
		let linkToSysRequirements: string;
		switch (process.platform) {
			case "linux":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-linux.html#system-requirements";
				break;
			case "win32":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-win.html#system-requirements";
				break;
			case "darwin":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-os-x.html#system-requirements";
				break;
			default:
				linkToSysRequirements = "";
		}

		return linkToSysRequirements;
	}

	public version = require("../package.json").version;

	public get HTML_CLI_HELPERS_DIR(): string {
		return path.join(__dirname, "../docs/helpers");
	}

	public get pathToPackageJson(): string {
		return path.join(__dirname, "..", "package.json");
	}

	public get PATH_TO_BOOTSTRAP(): string {
		return path.join(__dirname, "bootstrap.js");
	}

	private _adbFilePath: string = null;
	public async getAdbFilePath(): Promise<string> {
		if (!this._adbFilePath) {
			const androidToolsInfo: IAndroidToolsInfo = this.$injector.resolve("androidToolsInfo");
			this._adbFilePath = await androidToolsInfo.getPathToAdbFromAndroidHome() || await this.getAdbFilePathCore();
		}

		return this._adbFilePath;
	}

	private _userAgent: string = null;

	public get USER_AGENT_NAME(): string {
		if (!this._userAgent) {
			this._userAgent = `${this.CLIENT_NAME}CLI`;
		}

		return this._userAgent;
	}

	public set USER_AGENT_NAME(userAgentName: string) {
		this._userAgent = userAgentName;
	}

	public get MAN_PAGES_DIR(): string {
		return path.join(__dirname, "..", "docs", "man_pages");
	}

	public get HTML_PAGES_DIR(): string {
		return path.join(__dirname, "..", "docs", "html");
	}

	public get HTML_COMMON_HELPERS_DIR(): string {
		return path.join(__dirname, "common", "docs", "helpers");
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
		- Tie common src version to updates of adb, so that when we integrate a newer adb we can use it
		- Adb is named differently on OSes and may have additional files. The code is hairy to accommodate these differences
	 */
	private async spawnPrivateAdb(): Promise<string> {
		const $fs: IFileSystem = this.$injector.resolve("$fs"),
			$childProcess: IChildProcess = this.$injector.resolve("$childProcess"),
			$hostInfo: IHostInfo = this.$injector.resolve("$hostInfo");

		// prepare the directory to host our copy of adb
		const defaultAdbDirPath = path.join(__dirname, "common", "resources", "platform-tools", "android", process.platform);
		const pathToPackageJson = path.join(__dirname, "..", "package.json");
		const nsCliVersion = require(pathToPackageJson).version;
		const tmpDir = path.join(os.tmpdir(), `nativescript-cli-${nsCliVersion}`);
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
}
$injector.register("staticConfig", StaticConfig);
