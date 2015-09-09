require("./common/bootstrap");
$injector.require("config", "./config");
$injector.require("options", "./options");
// note: order above is important!
$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectData", "./project-data");
$injector.require("projectDataService", "./services/project-data-service");
$injector.require("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/android-project-service");
$injector.require("iOSProjectService", "./services/ios-project-service");

$injector.require("projectTemplatesService", "./services/project-templates-service");
$injector.require("tnsModulesService", "./services/tns-modules-service");

$injector.require("platformsData", "./platforms-data");
$injector.require("platformService", "./services/platform-service");

$injector.require("iOSDebugService", "./services/ios-debug-service");
$injector.require("androidDebugService", "./services/android-debug-service");

$injector.require("userSettingsService", "./services/user-settings-service");
$injector.require("analyticsSettingsService", "./services/analytics-settings-service");

$injector.require("emulatorSettingsService", "./services/emulator-settings-service");

$injector.require("usbLiveSyncService", "./services/usb-livesync-service");

$injector.require("platformCommandParameter", "./platform-command-param");
$injector.requireCommand("create", "./commands/create-project");
$injector.requireCommand("platform|*list", "./commands/list-platforms");
$injector.requireCommand("platform|add", "./commands/add-platform");
$injector.requireCommand("platform|remove", "./commands/remove-platform");
$injector.requireCommand("platform|update", "./commands/update-platform");
$injector.requireCommand("library|add", "./commands/add-library");
$injector.requireCommand("run|ios", "./commands/run");
$injector.requireCommand("run|android", "./commands/run");

$injector.requireCommand("debug|ios", "./commands/debug");
$injector.requireCommand("debug|android", "./commands/debug");

$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("build|ios", "./commands/build");
$injector.requireCommand("build|android", "./commands/build");
$injector.requireCommand("deploy", "./commands/deploy");
$injector.requireCommand("emulate|android", "./commands/emulate");
$injector.requireCommand("emulate|ios", "./commands/emulate");

$injector.require("npm", "./node-package-manager");
$injector.require("npmInstallationManager", "./npm-installation-manager");
$injector.require("lockfile", "./lockfile");
$injector.require("dynamicHelpProvider", "./dynamic-help-provider");
$injector.require("mobilePlatformsCapabilities", "./mobile-platforms-capabilities");
$injector.require("commandsServiceProvider", "./providers/commands-service-provider");
$injector.require("deviceAppDataProvider", "./providers/device-app-data-provider");

$injector.require("logcatPrinter", "./providers/logcat-printer");

$injector.require("broccoliBuilder", "./tools/broccoli/builder");
$injector.require("nodeModulesTree", "./tools/broccoli/trees/node-modules-tree");
$injector.require("broccoliPluginWrapper", "./tools/broccoli/broccoli-plugin-wrapper");

$injector.require("pluginVariablesService", "./services/plugin-variables-service");
$injector.require("pluginsService", "./services/plugins-service");
$injector.requireCommand("plugin|add", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|remove", "./commands/plugin/remove-plugin");

$injector.require("doctorService", "./services/doctor-service");
$injector.requireCommand("install", "./commands/install");

$injector.require("initService", "./services/init-service");
$injector.requireCommand("init", "./commands/init");

$injector.require("projectFilesManager", "./services/project-files-manager");
$injector.requireCommand("livesync", "./commands/livesync");
$injector.require("androidToolsInfo", "./android-tools-info");
