import { injector } from "./yok";
import { registerBuiltInCommand } from "./services/command-definition-adapter";
import { ICliGlobal } from "./definitions/cli-global";
import * as _ from "lodash";
(<ICliGlobal>(<unknown>global))._ = _;
(<ICliGlobal>(<unknown>global)).$injector = injector;

/**
 * The CLI owns every name it registers here, so a refusal is a mistake in this
 * file rather than a condition to report and carry on from, the way a
 * conflicting extension is.
 */
injector.require("errors", "./errors");
injector.requirePublic("fs", "./file-system");
injector.require("hostInfo", "./host-info");
injector.require("osInfo", "./os-info");

injector.require("commandDispatcher", "./dispatchers");

injector.require("resources", "./resource-loader");

injector.require("stringParameter", "./command-params");
injector.require("stringParameterBuilder", "./command-params");

injector.require("commandsService", "./services/commands-service");

injector.require("messagesService", "./services/messages-service");

injector.require("cancellation", "./services/cancellation");
injector.require("hooksService", "./services/hooks-service");

injector.require("httpClient", "./http-client");
injector.require("childProcess", "./child-process");
injector.require("prompter", "./prompter");
injector.require("projectHelper", "./project-helper");
injector.require("pluginVariablesHelper", "./plugin-variables-helper");

registerBuiltInCommand<typeof import("./commands/help").helpCommandDefinition>(
	"help",
	() => require("./commands/help").helpCommandDefinition,
);
registerBuiltInCommand<typeof import("./commands/help").helpCommandDefinition>(
	"/?",
	() => require("./commands/help").helpCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/analytics").usageReportingCommand
>(
	"usage-reporting",
	() => require("./commands/analytics").usageReportingCommand,
);
registerBuiltInCommand<
	typeof import("./commands/analytics").errorReportingCommand
>(
	"error-reporting",
	() => require("./commands/analytics").errorReportingCommand,
);

registerBuiltInCommand<
	typeof import("./commands/post-install").postInstallCommandDefinition
>(
	"dev-post-install",
	() => require("./commands/post-install").postInstallCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/autocompletion").autoCompleteCommandDefinition
>(
	"autocomplete|*default",
	() => require("./commands/autocompletion").autoCompleteCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/autocompletion").enableAutoCompleteCommandDefinition
>(
	"autocomplete|enable",
	() =>
		require("./commands/autocompletion").enableAutoCompleteCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/autocompletion").disableAutoCompleteCommandDefinition
>(
	"autocomplete|disable",
	() =>
		require("./commands/autocompletion").disableAutoCompleteCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/autocompletion").autoCompleteStatusCommandDefinition
>(
	"autocomplete|status",
	() =>
		require("./commands/autocompletion").autoCompleteStatusCommandDefinition,
);

registerBuiltInCommand<
	typeof import("./commands/device/list-devices").listDevicesCommandDefinition
>(
	"device|*list",
	() => require("./commands/device/list-devices").listDevicesCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-devices").listDevicesCommandDefinition
>(
	"devices|*list",
	() => require("./commands/device/list-devices").listDevicesCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-devices").androidListDevicesCommand
>(
	"device|android",
	() => require("./commands/device/list-devices").androidListDevicesCommand,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-devices").androidListDevicesCommand
>(
	"devices|android",
	() => require("./commands/device/list-devices").androidListDevicesCommand,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-devices").iosListDevicesCommand
>(
	"device|ios",
	() => require("./commands/device/list-devices").iosListDevicesCommand,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-devices").iosListDevicesCommand
>(
	"devices|ios",
	() => require("./commands/device/list-devices").iosListDevicesCommand,
);

registerBuiltInCommand<
	typeof import("./commands/device/device-log-stream").openDeviceLogStreamCommandDefinition
>(
	"device|log",
	() =>
		require("./commands/device/device-log-stream")
			.openDeviceLogStreamCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/run-application").runApplicationOnDeviceCommandDefinition
>(
	"device|run",
	() =>
		require("./commands/device/run-application")
			.runApplicationOnDeviceCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/stop-application").stopApplicationOnDeviceCommandDefinition
>(
	"device|stop",
	() =>
		require("./commands/device/stop-application")
			.stopApplicationOnDeviceCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-applications").listApplicationsCommandDefinition
>(
	"device|list-applications",
	() =>
		require("./commands/device/list-applications")
			.listApplicationsCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/uninstall-application").uninstallApplicationCommandDefinition
>(
	"device|uninstall",
	() =>
		require("./commands/device/uninstall-application")
			.uninstallApplicationCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/list-files").listFilesCommandDefinition
>(
	"device|list-files",
	() => require("./commands/device/list-files").listFilesCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/get-file").getFileCommandDefinition
>(
	"device|get-file",
	() => require("./commands/device/get-file").getFileCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/device/put-file").putFileCommandDefinition
>(
	"device|put-file",
	() => require("./commands/device/put-file").putFileCommandDefinition,
);

injector.require(
	"iosDeviceOperations",
	"./mobile/ios/device/ios-device-operations",
);

injector.require("deviceDiscovery", "./mobile/mobile-core/device-discovery");
injector.require(
	"iOSDeviceDiscovery",
	"./mobile/mobile-core/ios-device-discovery",
);
injector.require(
	"iOSSimulatorDiscovery",
	"./mobile/mobile-core/ios-simulator-discovery",
);
injector.require(
	"androidDeviceDiscovery",
	"./mobile/mobile-core/android-device-discovery",
);
injector.require(
	"androidEmulatorDiscovery",
	"./mobile/mobile-core/android-emulator-discovery",
);
injector.require("iOSDevice", "./mobile/ios/device/ios-device");
injector.require(
	"iOSDeviceProductNameMapper",
	"./mobile/ios/ios-device-product-name-mapper",
);
injector.require("androidDevice", "./mobile/android/android-device");
injector.require("adb", "./mobile/android/android-debug-bridge");
injector.require(
	"androidDebugBridgeResultHandler",
	"./mobile/android/android-debug-bridge-result-handler",
);
injector.require(
	"androidVirtualDeviceService",
	"./mobile/android/android-virtual-device-service",
);
injector.require(
	"androidIniFileParser",
	"./mobile/android/android-ini-file-parser",
);
injector.require(
	"androidGenymotionService",
	"./mobile/android/genymotion/genymotion-service",
);
injector.require(
	"virtualBoxService",
	"./mobile/android/genymotion/virtualbox-service",
);
injector.require("logcatHelper", "./mobile/android/logcat-helper");
injector.require("iOSSimResolver", "./mobile/ios/simulator/ios-sim-resolver");
injector.require(
	"iOSSimulatorLogProvider",
	"./mobile/ios/simulator/ios-simulator-log-provider",
);

injector.require(
	"localToDevicePathDataFactory",
	"./mobile/local-to-device-path-data-factory",
);

injector.requirePublic(
	"devicesService",
	"./mobile/mobile-core/devices-service",
);
injector.requirePublic(
	"androidProcessService",
	"./mobile/mobile-core/android-process-service",
);
injector.require("projectNameValidator", "./validators/project-name-validator");

injector.require(
	"androidEmulatorServices",
	"./mobile/android/android-emulator-services",
);
injector.require(
	"iOSEmulatorServices",
	"./mobile/ios/simulator/ios-emulator-services",
);

injector.require("autoCompletionService", "./services/auto-completion-service");
injector.requirePublic("settingsService", "./services/settings-service");
injector.require("opener", "./opener");
injector.require("microTemplateService", "./services/micro-templating-service");
injector.require("mobileHelper", "./mobile/mobile-helper");
injector.require("emulatorHelper", "./mobile/emulator-helper");
injector.require(
	"devicePlatformsConstants",
	"./mobile/device-platforms-constants",
);
injector.require("helpService", "./services/help-service");
injector.require(
	"messageContractGenerator",
	"./services/message-contract-generator",
);
injector.require("proxyService", "./services/proxy-service");
registerBuiltInCommand<
	typeof import("./commands/preuninstall").preUninstallCommandDefinition
>(
	"dev-preuninstall",
	() => require("./commands/preuninstall").preUninstallCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/generate-messages").generateMessagesCommandDefinition
>(
	"dev-generate-messages",
	() =>
		require("./commands/generate-messages").generateMessagesCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/doctor").doctorCommandDefinition
>("doctor|*all", () => require("./commands/doctor").doctorCommandDefinition);
registerBuiltInCommand<typeof import("./commands/doctor").iosDoctorCommand>(
	"doctor|ios",
	() => require("./commands/doctor").iosDoctorCommand,
);
registerBuiltInCommand<typeof import("./commands/doctor").androidDoctorCommand>(
	"doctor|android",
	() => require("./commands/doctor").androidDoctorCommand,
);

registerBuiltInCommand<
	typeof import("./commands/proxy/proxy-get").proxyGetCommandDefinition
>(
	"proxy|*get",
	() => require("./commands/proxy/proxy-get").proxyGetCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/proxy/proxy-set").proxySetCommandDefinition
>(
	"proxy|set",
	() => require("./commands/proxy/proxy-set").proxySetCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/proxy/proxy-clear").proxyClearCommandDefinition
>(
	"proxy|clear",
	() => require("./commands/proxy/proxy-clear").proxyClearCommandDefinition,
);

injector.require("utils", "./utils");
injector.require("plistParser", "./plist-parser");
injector.require("winreg", "./winreg");

injector.require("loggingLevels", "./mobile/logging-levels");
injector.require("logFilter", "./mobile/log-filter");
injector.require("androidLogFilter", "./mobile/android/android-log-filter");

injector.require("projectFilesManager", "./services/project-files-manager");
injector.require("xcodeSelectService", "./services/xcode-select-service");
injector.require("net", "./services/net-service");

injector.require(["lockfile", "lockService"], "./services/lock-service");
