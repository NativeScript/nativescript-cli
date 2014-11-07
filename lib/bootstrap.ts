require("./common/bootstrap");

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
$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("build", "./commands/build");
$injector.requireCommand("deploy", "./commands/deploy");
$injector.requireCommand("dev-post-install", "./commands/post-install");
$injector.requireCommand("emulate", "./commands/emulate");
$injector.requireCommand("list-devices", "./commands/list-devices");

$injector.require("npm", "./node-package-manager");
$injector.require("config", "./config");
