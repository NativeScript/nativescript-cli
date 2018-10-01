// enumeration taken from ProvisionType.cs
export class ProvisionType {
	static Development = "Development";
	static AdHoc = "AdHoc";
	static AppStore = "AppStore";
	static Enterprise = "Enterprise";
}

export class DeviceTypes {
	static Emulator = "Emulator";
	static Simulator = "Simulator";
	static Device = "Device";
}

export const APP_RESOURCES_FOLDER_NAME = "App_Resources";

export const ERROR_NO_DEVICES = "Cannot find connected devices. Reconnect any connected devices, verify that your system recognizes them, and run this command again.";
export const ERROR_CANT_USE_SIMULATOR = "You can use iOS simulator only on OS X.";
export const ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR = "Cannot find connected devices and cannot start iOS simulator on this OS.";
export const ERROR_CANNOT_RESOLVE_DEVICE = "Cannot resolve the specified connected device. The provided platform does not match the provided index or identifier. To list currently connected devices and verify that the specified pair of platform and index or identifier exists, run 'device'.";
export const ERROR_NO_VALID_SUBCOMMAND_FORMAT = "The input is not valid sub-command for '%s' command";

export const UNREACHABLE_STATUS = "Unreachable";
export const CONNECTED_STATUS = "Connected";

export const RUNNING_EMULATOR_STATUS = "Running";
export const NOT_RUNNING_EMULATOR_STATUS = "Not running";

export const APPLE_VENDOR_NAME = "Apple";

export class LiveSyncPaths {
	static SYNC_DIR_NAME = "sync";
	static REMOVEDSYNC_DIR_NAME = "removedsync";
	static FULLSYNC_DIR_NAME = "fullsync";
	static IOS_DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync";
	static IOS_DEVICE_SYNC_ZIP_PATH = "Library/Application Support/LiveSync/sync.zip";
	static ANDROID_TMP_DIR_NAME = "/data/local/tmp";
}

export class LiveSyncConstants {
	static VERSION_2 = 2;
	static VERSION_3 = 3;
	static GUID = "12590FAA-5EDD-4B12-856D-F52A0A1599F2";
	static DEVICE_TMP_DIR_FORMAT_V2 = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncConstants.GUID}/%s`;
	static ANDROID_FILES_PATH = `files/${LiveSyncConstants.GUID}`;
	static DEVICE_TMP_DIR_FORMAT_V3 = `/mnt/sdcard/Android/data/%s/${LiveSyncConstants.ANDROID_FILES_PATH}`;
	static CHECK_LIVESYNC_INTENT_NAME = "com.telerik.IsLiveSyncSupported";
	static IOS_PROJECT_PATH = "/Documents/AppBuilder/LiveSync";
}

export class HmrConstants {
	public static HMR_ERROR_STATUS = 3;
	public static HMR_SUCCESS_STATUS = 2;
}

export class DeviceDiscoveryEventNames {
	static DEVICE_FOUND = "deviceFound";
	static DEVICE_LOST = "deviceLost";
}

export class EmulatorDiscoveryNames {
	static EMULATOR_IMAGE_FOUND = "emulatorImageFound";
	static EMULATOR_IMAGE_LOST = "emulatorImageLost";
}

export const DEVICE_LOG_EVENT_NAME = "deviceLogData";
export const IOS_LOG_PREDICATE = 'senderImagePath contains "NativeScript" || eventMessage contains[c] "NativeScript"';

export const TARGET_FRAMEWORK_IDENTIFIERS = {
	Cordova: "Cordova",
	NativeScript: "NativeScript"
};

export class Configurations {
	static Debug = "Debug";
	static Release = "Release";
}

export const NODE_MODULES_DIR_NAME = "node_modules";
export const TNS_CORE_MODULES = "tns-core-modules";

export class FileExtensions {
	static TYPESCRIPT_DEFINITION_FILE = ".d.ts";
	static TYPESCRIPT_FILE = ".ts";
	static PNG_FILE = ".png";
	static NINE_PATCH_PNG_FILE = ".9.png";
}

export const IOS_POST_NOTIFICATION_COMMAND_TYPE = "PostNotification";
export const IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE = "ObserveNotification";
export const IOS_RELAY_NOTIFICATION_COMMAND_TYPE = "RelayNotification";

export class Proxy {
	static CACHE_FILE_NAME = "proxy-cache.json";
	static USE_PROXY = "USE_PROXY";
	static PROXY_PORT = "PROXY_PORT";
	static PROXY_HOSTNAME = "PROXY_HOSTNAME";
}

/**
 * Http status codes available from `require("http").STATUS_CODES`.
 */
export class HttpStatusCodes {
	static SEE_OTHER = 303;
	static PAYMENT_REQUIRED = 402;
	static PROXY_AUTHENTICATION_REQUIRED = 407;
}

export const HttpProtocolToPort: IDictionary<number> = {
	'http:': 80,
	'https:': 443
};

export const enum AnalyticsClients {
	Cli = "CLI",
	NonInteractive = "Non-interactive",
	Unknown = "Unknown"
}

export const DEFAULT_CHUNK_SIZE = 100;

export const enum CommandsDelimiters {
	HierarchicalCommand = "|",
	DefaultCommandSymbol = "*",
	DefaultHierarchicalCommand = "|*",
	HooksCommand = "-"
}

export const DEBUGGER_PORT_FOUND_EVENT_NAME = "DEBUGGER_PORT_FOUND";
export const ATTACH_REQUEST_EVENT_NAME = "ATTACH_REQUEST";

export class AndroidVirtualDevice {
	static ANDROID_DIR_NAME = ".android";
	static AVD_DIR_NAME = "avd";
	static ENCODING_MASK = /^avd\.ini\.encoding=(.*)$/;
	static INI_FILES_MASK = /^(.*)\.ini$/i;
	static AVD_FILES_MASK = /^(.*)\.avd$/i;
	static MIN_ANDROID_APILEVEL = 17;
	static MIN_ANDROID_VERSION = "4.2";
	/**
	 * The message that is printed from `avdmanager list avds`
	 */
	static AVAILABLE_AVDS_MESSAGE = "Available Android Virtual Devices:";
	/**
	 * The delimiter between devices that is used from `avdmanager list avds`
	 */
	static AVD_LIST_DELIMITER = "---------";
	static CONFIG_INI_FILE_NAME = "config.ini";
	static INI_FILE_EXTENSION = ".ini";
	static AVD_FILE_EXTENSION = ".avd";
	static RUNNING_AVD_EMULATOR_REGEX = /^(emulator-\d+)\s+device$/;
	static RUNNING_GENY_EMULATOR_REGEX = /^(.+?)\s+device$/;
	static GENYMOTION_VENDOR_NAME = "Genymotion";
	static AVD_VENDOR_NAME = "Avd";
	static TIMEOUT_SECONDS = 120;
	static GENYMOTION_DEFAULT_STDERR_STRING = "Logging activities to file";

	static UNABLE_TO_START_EMULATOR_MESSAGE = "Cannot run your app in the native emulator. Increase the timeout of the operation with the --timeout option or try to restart your adb server with 'adb kill-server' command. Alternatively, run the Android Virtual Device manager and increase the allocated RAM for the virtual device.";
}
