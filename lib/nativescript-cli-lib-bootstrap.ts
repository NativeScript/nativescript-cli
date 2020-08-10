import { IStaticConfig } from "./declarations";
import { injector } from "./common/yok";
require("./bootstrap");

injector.overrideAlreadyRequiredModule = true;

// Temporary!!! Should not require appbuilder's entry point of mobile-cli-lib,
// but once we separate logics in mobile-cli-lib, we should be able to require only specific bootstrap.
// Use this hack for now, as this will allow requiring {N} CLI as library directly and executing some device specific operations.
injector.requirePublicClass("deviceEmitter", "./common/mobile/device-emitter");
injector.requirePublicClass("deviceLogProvider", "./common/mobile/device-log-emitter");

injector.resolve<IStaticConfig>("staticConfig").disableAnalytics = true;
