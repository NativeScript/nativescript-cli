require("./common/bootstrap");

$injector.require("nativescript-cli", "./nativescript-cli");

$injector.requireCommand("create", "./commands/create-project-command");
