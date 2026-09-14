// Internal subsystem contracts of the injector facade. Deliberately NOT
// re-exported from nativescript/contracts: promoting one to the public
// surface is a one-line decision that should be made per contract, not by
// default. Each token resolves to the facade itself until its subsystem is
// physically extracted — at which point the provider is swapped and consumers
// keep working unchanged.
export {
	CommandRegistry,
	COMMAND_OWNER,
	describeRejection,
} from "./command-registry";
export type {
	DeferredCommandOptions,
	DeferredCommandRejection,
	DeferredCommandResult,
} from "./command-registry";
export { COMMAND_CONTEXT } from "./command-context";
export { ModuleRegistry } from "./module-registry";
export { PublicApiBuilder } from "./public-api-builder";
