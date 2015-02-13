require("./common/bootstrap");
$injector.require("config", "./config");
require("./options");
// note: order above is important!
$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectData", "./project-data");
$injector.require("projectDataService", "./services/project-data-service");
$injector.require("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/android-project-service");
$injector.require("iOSProjectService", "./services/ios-project-service");

$injector.require("projectTemplatesService", "./services/project-templates-service");

$injector.require("platformsData", "./platforms-data");
$injector.require("platformService", "./services/platform-service");

$injector.require("userSettingsService", "./services/user-settings-service");
$injector.require("analyticsSettingsService", "./services/analytics-settings-service");

$injector.require("emulatorSettingsService", "./services/emulator-settings-service");

$injector.require("platformCommandParameter", "./platform-command-param");
$injector.requireCommand("create", "./commands/create-project");
$injector.requireCommand("platform|*list", "./commands/list-platforms");
$injector.requireCommand("platform|add", "./commands/add-platform");
$injector.requireCommand("platform|remove", "./commands/remove-platform");
$injector.requireCommand("platform|update", "./commands/update-platform");
$injector.requireCommand("run", "./commands/run");
$injector.requireCommand("debug", "./commands/debug");
$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("build|ios", "./commands/build");
$injector.requireCommand("build|android", "./commands/build");
$injector.requireCommand("deploy", "./commands/deploy");
$injector.requireCommand("emulate|android", "./commands/emulate");
$injector.requireCommand("emulate|ios", "./commands/emulate");

$injector.require("npm", "./node-package-manager");
$injector.require("lockfile", "./lockfile");
$injector.require("optionsService", "./services/options-service");
