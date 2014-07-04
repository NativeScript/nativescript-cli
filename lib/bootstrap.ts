require("./common/bootstrap");

$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectService", "./services/project-service");
$injector.require("projectTemplatesService", "./services/project-templates-service");

$injector.requireCommand("create", "./commands/create-project-command");

$injector.require("npm", "./node-package-manager");
