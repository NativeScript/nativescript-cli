require("./common/bootstrap");

$injector.require("nativescript-cli", "./nativescript-cli");

$injector.require("projectService", "./services/project-service");
$injector.requireCommand("create", "./commands/create-project-command");

$injector.require("cutenessService", "./services/cuteness-service");
