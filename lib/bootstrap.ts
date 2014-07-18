require("./common/bootstrap");

$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectData", "./services/project-service");
$injector.require("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/project-service");
$injector.require("iOSProjectService", "./services/project-service");
$injector.require("projectTemplatesService", "./services/project-templates-service");
$injector.require("platformService", "./services/platform-service");

$injector.requireCommand("create", "./commands/create-project");
$injector.requireCommand("platform|*list", "./commands/list-platforms");
$injector.requireCommand("platform|add", "./commands/add-platform");
$injector.requireCommand("run", "./commands/run");
$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("build", "./commands/build");

$injector.require("npm", "./node-package-manager");
$injector.require("propertiesParser", "./properties-parser");
