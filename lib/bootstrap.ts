require("./common/bootstrap");

$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/project-service");
$injector.require("iOSProjectService", "./services/project-service");
$injector.require("projectTemplatesService", "./services/project-templates-service");
$injector.require("platformService", "./services/platform-service");

$injector.requireCommand("create", "./commands/create-project-command");
$injector.requireCommand("platform|*list", "./commands/list-platforms-command");
$injector.requireCommand("platform|add", "./commands/add-platform-command");
$injector.requireCommand("run", "./commands/run-command");
$injector.requireCommand("prepare", "./commands/prepare-command");
$injector.requireCommand("build", "./commands/build-command");

$injector.require("npm", "./node-package-manager");
$injector.require("propertiesParser", "./properties-parser");
