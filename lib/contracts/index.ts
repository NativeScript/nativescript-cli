// The `nativescript/contracts` entry point (resolved via contracts/package.json
// — deliberately no `exports` map, so existing deep requires keep working).
//
// This module must stay side-effect-free: an extension's duplicated CLI copy
// may load it, and it must never boot a second runtime. In particular nothing
// here may import lib/common/yok (whose import creates global.$injector).

export {
	Contract,
	getContractName,
	CONTRACT_NAME,
} from "../common/di/contract";
export type { IContractOptions } from "../common/di/contract";
export {
	InjectionToken,
	getInjectionTokenName,
	INJECTION_TOKEN_NAME,
} from "../common/di/injection-token";
export { inject, runInInjectionContext } from "../common/di/inject";
export { forwardRef, resolveForwardRef } from "../common/di/forward-ref";
export { Injector } from "../common/di/injector";
export type { InjectOptions } from "../common/di/injector";
export { provide, provideLazy } from "../common/di/providers";
export type {
	Provider,
	ProviderToken,
	Type,
	AbstractType,
} from "../common/di/providers";

export { ChildProcess } from "./child-process";
export { DevicesService } from "./devices-service";
export { DoctorService } from "./doctor-service";
export { Errors } from "./errors";
export { FileSystem } from "./file-system";
export { HostInfo } from "./host-info";
export { HttpClient } from "./http-client";
export { Logger } from "./logger";
export { PackageManager } from "./package-manager";
export { ProjectData } from "./project-data";
export { ProjectDataService } from "./project-data-service";
export { ProjectNameService } from "./project-name-service";
export { Prompter } from "./prompter";
export { TempService } from "./temp-service";

export { PBXPROJ_DOM_XCODE } from "./pbxproj-dom-xcode";
export { XCODE } from "./xcode";

export {
	defineCommand,
	isCommandDefinition,
	booleanOption,
	stringOption,
	numberOption,
	arrayOption,
} from "../common/define-command";
export type {
	CommandDefinition,
	DefinedCommand,
	CommandContext,
	CommandOptionSpec,
	DefaultedCommandOptionSpec,
	CommandOptionsSchema,
	CommandOptionSpecInit,
	CommandOptionType,
	CommandOptionValues,
} from "../common/define-command";
export { defineHook, isHookDefinition } from "../common/define-hook";
export type {
	HookContext,
	HookDefinition,
	HookDefinitionInput,
	HookHandler,
	HookMiddleware,
} from "../common/define-hook";
