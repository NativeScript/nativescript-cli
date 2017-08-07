require("./common/bootstrap");
$injector.require("logger", "./common/logger");
$injector.require("config", "./config");
$injector.require("options", "./options");
// note: order above is important!
$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectData", "./project-data");
$injector.require("projectDataService", "./services/project-data-service");
$injector.requirePublic("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/android-project-service");
$injector.require("iOSEntitlementsService", "./services/ios-entitlements-service");
$injector.require("iOSProjectService", "./services/ios-project-service");
$injector.require("iOSProvisionService", "./services/ios-provision-service");
$injector.require("xCConfigService", "./services/xcconfig-service");

$injector.require("cocoapodsService", "./services/cocoapods-service");

$injector.require("projectTemplatesService", "./services/project-templates-service");
$injector.require("projectNameService", "./services/project-name-service");
$injector.require("tnsModulesService", "./services/tns-modules-service");

$injector.require("platformsData", "./platforms-data");
$injector.require("platformService", "./services/platform-service");

$injector.require("debugDataService", "./services/debug-data-service");
$injector.requirePublicClass("debugService", "./services/debug-service");
$injector.require("iOSDebugService", "./services/ios-debug-service");
$injector.require("androidDebugService", "./services/android-debug-service");

$injector.require("userSettingsService", "./services/user-settings-service");
$injector.require("analyticsSettingsService", "./services/analytics-settings-service");
$injector.requirePublic("analyticsService", "./services/analytics-service");

$injector.require("emulatorSettingsService", "./services/emulator-settings-service");

$injector.require("platformCommandParameter", "./platform-command-param");
$injector.requireCommand("create", "./commands/create-project");
$injector.requireCommand("platform|*list", "./commands/list-platforms");
$injector.requireCommand("platform|add", "./commands/add-platform");
$injector.requireCommand("platform|remove", "./commands/remove-platform");
$injector.requireCommand("platform|update", "./commands/update-platform");
$injector.requireCommand("run|*all", "./commands/run");
$injector.requireCommand("run|ios", "./commands/run");
$injector.requireCommand("run|android", "./commands/run");

$injector.requireCommand("debug|ios", "./commands/debug");
$injector.requireCommand("debug|android", "./commands/debug");

$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("clean-app|ios", "./commands/clean-app");
$injector.requireCommand("clean-app|android", "./commands/clean-app");
$injector.requireCommand("build|ios", "./commands/build");
$injector.requireCommand("build|android", "./commands/build");
$injector.requireCommand("deploy", "./commands/deploy");

$injector.require("testExecutionService", "./services/test-execution-service");
$injector.requireCommand("dev-test|android", "./commands/test");
$injector.requireCommand("dev-test|ios", "./commands/test");
$injector.requireCommand("test|android", "./commands/test");
$injector.requireCommand("test|ios", "./commands/test");
$injector.requireCommand("test|init", "./commands/test-init");
$injector.requireCommand("dev-generate-help", "./commands/generate-help");

$injector.requireCommand("appstore|*list", "./commands/appstore-list");
$injector.requireCommand("appstore|upload", "./commands/appstore-upload");
$injector.requireCommand("publish|ios", "./commands/appstore-upload");
$injector.require("itmsTransporterService", "./services/itmstransporter-service");

$injector.requirePublic("npm", "./node-package-manager");
$injector.require("npmInstallationManager", "./npm-installation-manager");
$injector.require("lockfile", "./lockfile");
$injector.require("dynamicHelpProvider", "./dynamic-help-provider");
$injector.require("mobilePlatformsCapabilities", "./mobile-platforms-capabilities");
$injector.require("commandsServiceProvider", "./providers/commands-service-provider");
$injector.require("deviceAppDataProvider", "./providers/device-app-data-provider");

$injector.require("deviceLogProvider", "./common/mobile/device-log-provider");
$injector.require("projectFilesProvider", "./providers/project-files-provider");

$injector.require("nodeModulesBuilder", "./tools/node-modules/node-modules-builder");

$injector.require("pluginVariablesService", "./services/plugin-variables-service");
$injector.require("pluginsService", "./services/plugins-service");
$injector.requireCommand("plugin|*list", "./commands/plugin/list-plugins");
$injector.requireCommand("plugin|add", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|install", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|remove", "./commands/plugin/remove-plugin");
$injector.requireCommand("plugin|update", "./commands/plugin/update-plugin");

$injector.require("doctorService", "./services/doctor-service");
$injector.require("xcprojService", "./services/xcproj-service");
$injector.require("versionsService", "./services/versions-service");
$injector.requireCommand("install", "./commands/install");

$injector.require("initService", "./services/init-service");
$injector.requireCommand("init", "./commands/init");

$injector.require("infoService", "./services/info-service");
$injector.requireCommand("info", "./commands/info");

$injector.require("androidToolsInfo", "./android-tools-info");
$injector.require("devicePathProvider", "./device-path-provider");

$injector.requireCommand("platform|clean", "./commands/platform-clean");

$injector.requirePublicClass("liveSyncService", "./services/livesync/livesync-service");
$injector.require("liveSyncCommandHelper", "./services/livesync/livesync-command-helper");
$injector.requirePublicClass("debugLiveSyncService", "./services/livesync/debug-livesync-service");
$injector.require("androidLiveSyncService", "./services/livesync/android-livesync-service");
$injector.require("iOSLiveSyncService", "./services/livesync/ios-livesync-service");
$injector.require("usbLiveSyncService", "./services/livesync/livesync-service"); // The name is used in https://github.com/NativeScript/nativescript-dev-typescript
$injector.require("sysInfo", "./sys-info");

$injector.require("iOSNotificationService", "./services/ios-notification-service");
$injector.require("socketProxyFactory", "./device-sockets/ios/socket-proxy-factory");
$injector.require("iOSNotification", "./device-sockets/ios/notification");
$injector.require("iOSSocketRequestExecutor", "./device-sockets/ios/socket-request-executor");
$injector.require("messages", "./common/messages/messages");
$injector.require("xmlValidator", "./xml-validator");

$injector.requireCommand("post-install-cli", "./commands/post-install");
$injector.requireCommand("update", "./commands/update");

$injector.require("iOSLogFilter", "./services/ios-log-filter");
$injector.require("projectChangesService", "./services/project-changes-service");

$injector.require("emulatorPlatformService", "./services/emulator-platform-service");

$injector.require("pbxprojDomXcode", "./node/pbxproj-dom-xcode");
$injector.require("xcode", "./node/xcode");

$injector.require("staticConfig", "./config");

$injector.require("requireService", "./services/require-service");

$injector.requireCommand("extension|*list", "./commands/extensibility/list-extensions");
$injector.requireCommand("extension|install", "./commands/extensibility/install-extension");
$injector.requireCommand("extension|uninstall", "./commands/extensibility/uninstall-extension");
$injector.requirePublic("extensibilityService", "./services/extensibility-service");

$injector.require("nodeModulesDependenciesBuilder", "./tools/node-modules/node-modules-dependencies-builder");
$injector.require("subscriptionService", "./services/subscription-service");
