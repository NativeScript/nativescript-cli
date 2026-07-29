import { IDisposable, IDictionary } from "../declarations";
import { ICommand } from "./commands";
import { IKeyCommand, IValidKeyName } from "./key-commands";

/**
 * The legacy injector facade surface. Every member is individually
 * @deprecated in favor of the token-based container in lib/common/di;
 * the interface itself survives until the hook/extension deprecation
 * completes.
 */
interface IInjector extends IDisposable {
	/**
	 * @deprecated Use provideLazy() from lib/common/di — the same deferred
	 * loading, token-based.
	 */
	require(name: string, file: string): void;
	/**
	 * @deprecated Use provideLazy() from lib/common/di — the same deferred
	 * loading, token-based.
	 */
	require(names: string[], file: string): void;
	/**
	 * @deprecated Legacy public-API builder.
	 */
	requirePublic(names: string | string[], file: string): void;
	/**
	 * @deprecated Legacy public-API builder.
	 */
	requirePublicClass(names: string | string[], file: string): void;
	/**
	 * @deprecated Path-based command registration; slated for replacement by
	 * manifest-declared commands.
	 */
	requireCommand(name: string, file: string): void;
	/**
	 * @deprecated Path-based command registration; slated for replacement by
	 * manifest-declared commands.
	 */
	requireCommand(names: string[], file: string): void;
	/**
	 * @deprecated Replaced together with the command registry.
	 */
	requireKeyCommand(name: IValidKeyName, file: string): void;
	/**
	 * Resolves an implementation by constructor function.
	 * The injector will create new instances for every call.
	 * @deprecated Use Injector.createInstance from lib/common/di.
	 */
	resolve(ctor: Function, ctorArguments?: { [key: string]: any }): any;
	/**
	 * @deprecated Use Injector.createInstance from lib/common/di.
	 */
	resolve<T>(ctor: Function, ctorArguments?: { [key: string]: any }): T;
	/**
	 * Resolves an implementation by name.
	 * The injector will create only one instance per name and return the same instance on subsequent calls.
	 * @deprecated Use inject(Token) in an injection context, or Injector.get
	 * from lib/common/di.
	 */
	resolve(name: string, ctorArguments?: IDictionary<any>): any;
	/**
	 * @deprecated Use inject(Token) in an injection context, or Injector.get
	 * from lib/common/di.
	 */
	resolve<T>(name: string, ctorArguments?: IDictionary<any>): T;

	/**
	 * @deprecated Legacy command-registry lookup.
	 */
	resolveCommand(name: string): ICommand;
	/**
	 * @deprecated Legacy command-registry lookup.
	 */
	resolveKeyCommand(key: string): IKeyCommand;
	/**
	 * @deprecated Use provide() / Injector.register from lib/common/di; a
	 * contract's token name keeps string spellings resolvable.
	 */
	register(name: string, resolver: any, shared?: boolean): void;
	/**
	 * @deprecated Slated for replacement by defineCommand and manifest-declared
	 * commands.
	 */
	registerCommand(name: string, resolver: any): void;
	/**
	 * @deprecated Slated for replacement by defineCommand and manifest-declared
	 * commands.
	 */
	registerCommand(names: string[], resolver: any): void;
	/**
	 * @deprecated Replaced together with the command registry.
	 */
	registerKeyCommand(key: IValidKeyName, resolver: any): void;
	/**
	 * @deprecated Legacy command-registry enumeration; feeds shell
	 * autocompletion and help.
	 */
	getRegisteredCommandsNames(includeDev: boolean): string[];
	/**
	 * @deprecated Legacy command-registry enumeration.
	 */
	getRegisteredKeyCommandsNames(): string[];
	/**
	 * @deprecated String-reflective help templating; removable only together
	 * with the help-template pipeline.
	 */
	dynamicCallRegex: RegExp;
	/**
	 * @deprecated See dynamicCallRegex.
	 */
	dynamicCall(call: string, args?: any[]): Promise<any>;
	/**
	 * @deprecated Legacy command-registry routing.
	 */
	isDefaultCommand(commandName: string): boolean;
	/**
	 * @deprecated Legacy command-registry routing.
	 * Side-effecting: fails with help output on a bad subcommand.
	 */
	isValidHierarchicalCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean>;
	/**
	 * @deprecated Legacy command-registry routing.
	 */
	getChildrenCommandsNames(commandName: string): string[];
	/**
	 * @deprecated Hierarchical-routing internals of the legacy command
	 * registry.
	 */
	buildHierarchicalCommand(
		parentCommandName: string,
		commandLineArguments: string[],
	): any;
	/**
	 * @deprecated Backing store of the require('nativescript') surface.
	 * Do not add new entries through it.
	 */
	publicApi: any;

	/**
	 * Defines if it's allowed to override already required module.
	 * This can be used in order to allow redefinition of modules, for example $logger can be replaced by a plugin.
	 * Default value is false.
	 * @deprecated Escape hatch of the legacy require-time module map.
	 */
	overrideAlreadyRequiredModule: boolean;
}

/**
 * @deprecated The process-wide legacy injector global. New code receives the
 * container via inject(Injector) from lib/common/di.
 */
declare var $injector: IInjector;
