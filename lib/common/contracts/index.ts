// Subsystem contracts of the injector facade. Promoting one to
// nativescript/contracts is a one-line decision made per contract, not by
// default; COMMAND_CONTEXT, COMMAND_PRECONDITIONS and CommandsService are
// the promoted ones. A facade token resolves to the facade itself until its
// subsystem is physically extracted — at which point the provider is swapped
// and consumers keep working unchanged.
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
export { COMMAND_PRECONDITIONS } from "./command-preconditions";
export type { CommandPrecondition } from "./command-preconditions";
export { CommandsService } from "./commands-service";
export type { CommandDispatchOptions } from "./commands-service";
export { ModuleRegistry } from "./module-registry";
export { PublicApiBuilder } from "./public-api-builder";
