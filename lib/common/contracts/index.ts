// Internal subsystem contracts of the injector facade. Deliberately NOT
// re-exported from nativescript/contracts: promoting one to the public
// surface is a one-line decision that should be made per contract, not by
// default. Each token resolves to the facade itself until its subsystem is
// physically extracted — at which point the provider is swapped and consumers
// keep working unchanged.
export { CommandRegistry } from "./command-registry";
export { KeyCommandRegistry } from "./key-command-registry";
export { ModuleRegistry } from "./module-registry";
export { PublicApiBuilder } from "./public-api-builder";
