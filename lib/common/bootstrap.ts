(<ICliGlobal>global)._ = require("lodash");
(<ICliGlobal>global).$injector = require("./yok").injector;

require("colors");
$injector.require("errors", "./errors");
$injector.requirePublic("fs", "./file-system");
$injector.require("hostInfo", "./host-info");
$injector.require("osInfo", "./os-info");

$injector.require("dispatcher", "./dispatchers");
$injector.require("commandDispatcher", "./dispatchers");

$injector.require("resources", "./resource-loader");

$injector.require("stringParameter", "./command-params");
$injector.require("stringParameterBuilder", "./command-params");

$injector.require("commandsService", "./services/commands-service");

$injector.require("messagesService", "./services/messages-service");

$injector.require("cancellation", "./services/cancellation");
$injector.require("hooksService", "./services/hooks-service");

$injector.require("httpClient", "./http-client");
$injector.require("childProcess", "./child-process");
$injector.require("prompter", "./prompter");
$injector.require("projectHelper", "./project-helper");
$injector.require("pluginVariablesHelper", "./plugin-variables-helper");
$injector.require("progressIndicator", "./progress-indicator");

$injector.requireCommand(["help", "/?"], "./commands/help");
$injector.requireCommand("usage-reporting", "./commands/analytics");
$injector.requireCommand("error-reporting", "./commands/analytics");

$injector.requireCommand("dev-post-install", "./commands/post-install");
$injector.requireCommand("autocomplete|*default", "./commands/autocompletion");
$injector.requireCommand("autocomplete|enable", "./commands/autocompletion");
$injector.requireCommand("autocomplete|disable", "./commands/autocompletion");
$injector.requireCommand("autocomplete|status", "./commands/autocompletion");

$injector.requireCommand(["device|*list", "devices|*list"], "./commands/device/list-devices");
$injector.requireCommand(["device|android", "devices|android"], "./commands/device/list-devices");
$injector.requireCommand(["device|ios", "devices|ios"], "./commands/device/list-devices");

$injector.requireCommand("device|log", "./commands/device/device-log-stream");
$injector.requireCommand("device|run", "./commands/device/run-application");
$injector.requireCommand("device|stop", "./commands/device/stop-application");
$injector.requireCommand("device|list-applications", "./commands/device/list-applications");
$injector.requireCommand("device|uninstall", "./commands/device/uninstall-application");
$injector.requireCommand("device|list-files", "./commands/device/list-files");
$injector.requireCommand("device|get-file", "./commands/device/get-file");
$injector.requireCommand("device|put-file", "./commands/device/put-file");

$injector.require("iosDeviceOperations", "./mobile/ios/device/ios-device-operations");

$injector.require("iTunesValidator", "./validators/iTunes-validator");
$injector.require("deviceDiscovery", "./mobile/mobile-core/device-discovery");
$injector.require("iOSDeviceDiscovery", "./mobile/mobile-core/ios-device-discovery");
$injector.require("iOSSimulatorDiscovery", "./mobile/mobile-core/ios-simulator-discovery");
$injector.require("androidDeviceDiscovery", "./mobile/mobile-core/android-device-discovery");
$injector.require("androidEmulatorDiscovery", "./mobile/mobile-core/android-emulator-discovery");
$injector.require("iOSDevice", "./mobile/ios/device/ios-device");
$injector.require("iOSDeviceProductNameMapper", "./mobile/ios/ios-device-product-name-mapper");
$injector.require("androidDevice", "./mobile/android/android-device");
$injector.require("adb", "./mobile/android/android-debug-bridge");
$injector.require("androidDebugBridgeResultHandler", "./mobile/android/android-debug-bridge-result-handler");
$injector.require("androidVirtualDeviceService", "./mobile/android/android-virtual-device-service");
$injector.require("androidIniFileParser", "./mobile/android/android-ini-file-parser");
$injector.require("androidGenymotionService", "./mobile/android/genymotion/genymotion-service");
$injector.require("virtualBoxService", "./mobile/android/genymotion/virtualbox-service");
$injector.require("logcatHelper", "./mobile/android/logcat-helper");
$injector.require("iOSSimResolver", "./mobile/ios/simulator/ios-sim-resolver");
$injector.require("iOSSimulatorLogProvider", "./mobile/ios/simulator/ios-simulator-log-provider");

$injector.require("localToDevicePathDataFactory", "./mobile/local-to-device-path-data-factory");
$injector.require("deviceAppDataFactory", "./mobile/device-app-data/device-app-data-factory");

$injector.requirePublic("typeScriptService", "./services/typescript-service");

$injector.requirePublic("devicesService", "./mobile/mobile-core/devices-service");
$injector.requirePublic("androidProcessService", "./mobile/mobile-core/android-process-service");
$injector.require("projectNameValidator", "./validators/project-name-validator");

$injector.require("androidEmulatorServices", "./mobile/android/android-emulator-services");
$injector.require("iOSEmulatorServices", "./mobile/ios/simulator/ios-emulator-services");
$injector.require("wp8EmulatorServices", "./mobile/wp8/wp8-emulator-services");

$injector.require("autoCompletionService", "./services/auto-completion-service");
$injector.require("processService", "./services/process-service");
$injector.requirePublic("settingsService", "./services/settings-service");
$injector.require("opener", "./opener");
$injector.require("dynamicHelpService", "./services/dynamic-help-service");
$injector.require("microTemplateService", "./services/micro-templating-service");
$injector.require("mobileHelper", "./mobile/mobile-helper");
$injector.require("emulatorHelper", "./mobile/emulator-helper");
$injector.require("devicePlatformsConstants", "./mobile/device-platforms-constants");
$injector.require("helpService", "./services/help-service");
$injector.require("messageContractGenerator", "./services/message-contract-generator");
$injector.require("proxyService", "./services/proxy-service");
$injector.requireCommand("dev-preuninstall", "./commands/preuninstall");
$injector.requireCommand("dev-generate-messages", "./commands/generate-messages");
$injector.requireCommand("doctor", "./commands/doctor");

$injector.requireCommand("proxy|*get", "./commands/proxy/proxy-get");
$injector.requireCommand("proxy|set", "./commands/proxy/proxy-set");
$injector.requireCommand("proxy|clear", "./commands/proxy/proxy-clear");

$injector.require("utils", "./utils");
$injector.require("plistParser", "./plist-parser");
$injector.require("winreg", "./winreg");

$injector.require("loggingLevels", "./mobile/logging-levels");
$injector.require("logFilter", "./mobile/log-filter");
$injector.require("androidLogFilter", "./mobile/android/android-log-filter");

$injector.require("projectFilesManager", "./services/project-files-manager");
$injector.require("xcodeSelectService", "./services/xcode-select-service");
$injector.require("net", "./services/net-service");

$injector.require("qr", "./services/qr");
$injector.require("printPluginsService", "./services/plugins/print-plugins-service");
$injector.require("npmPluginsService", "./services/plugins/npm-plugins-service");

$injector.require("lockfile", "./services/lockfile");
