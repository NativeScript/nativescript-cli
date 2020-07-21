declare module Config {
	interface IStaticConfig {
		PROJECT_FILE_NAME: string;
		CLIENT_NAME_KEY_IN_PROJECT_FILE?: string;
		CLIENT_NAME: string;
		USER_AGENT_NAME: string;
		CLIENT_NAME_ALIAS?: string;
		FULL_CLIENT_NAME?: string;
		ANALYTICS_INSTALLATION_ID_SETTING_NAME: string;
		TRACK_FEATURE_USAGE_SETTING_NAME: string;
		ERROR_REPORT_SETTING_NAME: string;
		SYS_REQUIREMENTS_LINK: string;
		version: string;
		getAdbFilePath(): Promise<string>;
		disableAnalytics?: boolean;
		disableCommandHooks?: boolean;
		enableDeviceRunCommandOnWindows?: boolean;
		MAN_PAGES_DIR: string;
		HTML_PAGES_DIR: string;
		HTML_COMMON_HELPERS_DIR: string;
		HTML_CLI_HELPERS_DIR: string;
		pathToPackageJson: string;
		RESOURCE_DIR_PATH: string;
		PATH_TO_BOOTSTRAP: string;
		QR_SIZE: number;
		PROFILE_DIR_NAME: string;
	}

	interface IConfig {
		DEBUG?: boolean;
		DISABLE_HOOKS: boolean;
	}
}
