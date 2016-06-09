import * as path from "path";
import {StaticConfigBase} from "./common/static-config-base";
import {ConfigBase} from "./common/config-base";
import { startPackageActivityNames } from "./common/mobile/constants";

export class Configuration extends ConfigBase implements IConfiguration { // User specific config
	CI_LOGGER = false;
	DEBUG = false;
	TYPESCRIPT_COMPILER_OPTIONS = {};
	USE_PROXY = false;
	ANDROID_DEBUG_UI: string = null;
	USE_POD_SANDBOX: boolean = true;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(protected $fs: IFileSystem) {
		super($fs);
		_.extend(this, this.loadConfig("config").wait());
	}
}
$injector.register("config", Configuration);

export class StaticConfig extends StaticConfigBase implements IStaticConfig {
	public PROJECT_FILE_NAME = "package.json";
	public CLIENT_NAME_KEY_IN_PROJECT_FILE = "nativescript";
	public CLIENT_NAME = "tns";
	public CLIENT_NAME_ALIAS = "NativeScript";
	public ANALYTICS_API_KEY = "5752dabccfc54c4ab82aea9626b7338e";
	public ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "TrackFeatureUsage";
	public ERROR_REPORT_SETTING_NAME = "TrackExceptions";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public START_PACKAGE_ACTIVITY_NAME = startPackageActivityNames[this.CLIENT_NAME_ALIAS.toLowerCase()];
	public INSTALLATION_SUCCESS_MESSAGE = "Installation successful. You are good to go. Connect with us on `http://twitter.com/NativeScript`.";

	constructor($injector: IInjector) {
		super($injector);
		this.RESOURCE_DIR_PATH = path.join(this.RESOURCE_DIR_PATH, "../../resources");
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

	public get helpTextPath(): string {
		return path.join(__dirname, "../resources/help.txt");
	}

	public get HTML_CLI_HELPERS_DIR(): string {
		return path.join(__dirname, "../docs/helpers");
	}

	public get pathToPackageJson(): string {
		return path.join(__dirname, "..", "package.json");
	}

	public get PATH_TO_BOOTSTRAP(): string {
		return path.join(__dirname, "bootstrap");
	}

	public getAdbFilePath(): IFuture<string> {
		return (() => {
			if (!this._adbFilePath) {
				let androidToolsInfo: IAndroidToolsInfo = this.$injector.resolve("androidToolsInfo");
				this._adbFilePath = androidToolsInfo.getPathToAdbFromAndroidHome().wait() || super.getAdbFilePath().wait();
			}

			return this._adbFilePath;
		}).future<string>()();
	}
}
$injector.register("staticConfig", StaticConfig);
