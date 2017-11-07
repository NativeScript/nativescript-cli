require("./bootstrap");

$injector.overrideAlreadyRequiredModule = true;

// Temporary!!! Should not require appbuilder's entry point of mobile-cli-lib,
// but once we separate logics in mobile-cli-lib, we should be able to require only specific bootstrap.
// Use this hack for now, as this will allow requiring {N} CLI as library directly and executing some device specific operations.
$injector.requirePublic("companionAppsService", "./common/appbuilder/services/livesync/companion-apps-service");
$injector.requirePublicClass("deviceEmitter", "./common/appbuilder/device-emitter");
$injector.requirePublicClass("deviceLogProvider", "./common/appbuilder/device-log-provider");

$injector.resolve<IStaticConfig>("staticConfig").disableAnalytics = true;
