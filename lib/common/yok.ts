import * as path from "path";
import * as _ from "lodash";
import { isPromise } from "./helpers";
import { reportDeprecation } from "./deprecation";
import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "./constants";
import { CommandsDelimiters } from "./constants";
import { IDictionary } from "./declarations";
import { IInjector } from "./definitions/yok";
import { ICommandArgument, ICommand } from "./definitions/commands";
import { IKeyCommand, IValidKeyName } from "./definitions/key-commands";
import { Injector } from "./di/injector";
import type { Provider } from "./di/providers";
import {
	CommandRegistry,
	KeyCommandRegistry,
	ModuleRegistry,
	PublicApiBuilder,
} from "./contracts";
import type {
	DeferredCommandOptions,
	DeferredCommandRejection,
	DeferredCommandResult,
} from "./contracts";

/**
 * The legacy global facade binding. New code should obtain the container via
 * inject(Injector) inside an injection context rather than importing this;
 * every legacy member on it is individually marked @deprecated.
 */
export let injector: IInjector;

function rejected(rejection: DeferredCommandRejection): DeferredCommandResult {
	return { registered: false, rejection };
}

function forEachName(names: any, action: (name: string) => void): void {
	if (_.isString(names)) {
		action(names);
	} else {
		names.forEach(action);
	}
}

/**
 * @deprecated Yok-era class decorator with zero call sites; do not adopt.
 */
export function register(...rest: any[]) {
	return function (target: any): void {
		// TODO: Check if 'rest' has more arguments that have to be registered
		injector.register(rest[0], target);
	};
}

/**
 * @deprecated Shape of Yok's old internal records; the container now keeps
 * provider records in lib/common/di.
 */
export interface IDependency {
	require?: string;
	resolver?: () => any;
	instances?: any[];
	shared?: boolean;
}

/**
 * The Yok facade IS the token-based `Injector` — it extends it — plus the
 * legacy surface: command routing, the key-command namespace, the module
 * loader, and the public-API builder. Those subsystems historically shared
 * the container object and migrate out separately; until then they live here,
 * individually marked @deprecated.
 */
export class Yok extends Injector implements IInjector {
	/**
	 * @deprecated Escape hatch of the legacy require-time module map.
	 */
	public overrideAlreadyRequiredModule: boolean = false;

	constructor() {
		super();
		this.register("injector", this);
		// Each subsystem face resolves to the facade until it is physically
		// extracted; extraction then swaps the provider without touching
		// consumers of the token.
		this.register([
			{ provide: CommandRegistry, useValue: this },
			{ provide: KeyCommandRegistry, useValue: this },
			{ provide: ModuleRegistry, useValue: this },
			{ provide: PublicApiBuilder, useValue: this },
		]);
	}

	private COMMANDS_NAMESPACE: string = "commands";
	/**
	 * Parents whose dispatcher THIS instance synthesized. The require-ordering
	 * guard below must not fire for them: they exist because a child was
	 * registered, not because child requires ran out of order.
	 */
	private synthesizedParents = new Set<string>();
	/**
	 * Parents whose record is only the placeholder requireCommand creates so a
	 * child's module can be loaded through the parent name. The dispatcher is
	 * meant to replace it once that module registers itself.
	 */
	private placeholderParents = new Set<string>();
	private KEY_COMMANDS_NAMESPACE: string = "keyCommands";
	private hierarchicalCommands: IDictionary<string[]> = {};
	/** Deferred command name -> the owner that claimed it first. */
	private deferredCommandOwners: IDictionary<string> = {};

	/**
	 * @deprecated Path-based command registration; use registerDeferredCommand,
	 * which routes without loading and reports conflicts structurally.
	 */
	public requireCommand(names: any, file: string): void {
		forEachName(names, (commandName) => {
			const commands = commandName.split(
				CommandsDelimiters.HierarchicalCommand,
			);

			if (commands.length > 1) {
				if (
					_.startsWith(commands[1], "*") &&
					this.has(this.createCommandName(commands[0])) &&
					!this.synthesizedParents.has(commands[0])
				) {
					throw new Error(
						"Default commands should be required before child commands",
					);
				}

				const parentCommandName = commands[0];

				if (!this.hierarchicalCommands[parentCommandName]) {
					this.hierarchicalCommands[parentCommandName] = [];
				}

				this.hierarchicalCommands[parentCommandName].push(
					_.tail(commands).join(CommandsDelimiters.HierarchicalCommand),
				);
			}

			if (
				commands.length > 1 &&
				!this.has(this.createCommandName(commands[0]))
			) {
				this.placeholderParents.add(commands[0]);
				this.require(this.createCommandName(commands[0]), file);
				if (commands[1] && !commandName.match(/\|\*/)) {
					this.require(this.createCommandName(commandName), file);
				}
			} else if (!commandName.match(/\|\*/)) {
				// Mirrors the default-command skip of the branch above: a default's
				// own record comes from registerCommand, never from a require path.
				this.require(this.createCommandName(commandName), file);
			}
		});
	}

	public registerDeferredCommand(
		name: string,
		options: DeferredCommandOptions,
	): DeferredCommandResult {
		if (name !== name.toLowerCase()) {
			return rejected({
				reason: "invalid-name",
				detail:
					`command names are matched in lower case, so '${name}' can never ` +
					`be dispatched; declare it as '${name.toLowerCase()}'`,
			});
		}

		const claimedBy = this.deferredCommandOwners[name];
		if (claimedBy) {
			return claimedBy === options.owner
				? { registered: true }
				: rejected({ reason: "claimed", owner: claimedBy });
		}

		const commandRecordName = this.createCommandName(name);
		if (this.has(commandRecordName)) {
			return rejected(
				this.synthesizedParents.has(name)
					? { reason: "subcommand-parent" }
					: { reason: "built-in" },
			);
		}

		super.register({
			provide: commandRecordName,
			useLazyRequire: () => {
				try {
					options.load();
				} catch (err) {
					throw new Error(
						`Unable to load command '${name}' of ${options.owner} from ` +
							`${options.source}: ${err.message}`,
					);
				}

				if (!this.hasResolver(commandRecordName)) {
					throw new Error(
						`Command '${name}' of ${options.owner} was not registered when ` +
							`${options.source} loaded. The module must export a ` +
							`defineCommand() definition or register the command itself.`,
					);
				}
			},
		});
		this.deferredCommandOwners[name] = options.owner;

		const commands = name.split(CommandsDelimiters.HierarchicalCommand);
		if (commands.length > 1) {
			const parentCommandName = commands[0];
			const subCommandName = _.tail(commands).join(
				CommandsDelimiters.HierarchicalCommand,
			);

			if (!this.hierarchicalCommands[parentCommandName]) {
				this.hierarchicalCommands[parentCommandName] = [];
			}

			if (
				!_.includes(
					this.hierarchicalCommands[parentCommandName],
					subCommandName,
				)
			) {
				this.hierarchicalCommands[parentCommandName].push(subCommandName);
			}

			// The dispatcher routes off the recorded subcommand names alone, so
			// reaching a sibling never loads this entry's module.
			this.createHierarchicalCommand(parentCommandName, name);
		}

		return { registered: true };
	}

	/**
	 * @deprecated Use provideLazy() from lib/common/di (via `Yok.di`) — the same
	 * deferred loading, token-based.
	 */
	public require(names: any, file: string): void {
		forEachName(names, (name) => this.requireOne(name, file));
	}

	/**
	 * @deprecated Key-command counterpart of requireCommand; replaced together
	 * with the command registry.
	 */
	public requireKeyCommand(name: any, file: string): void {
		this.requireOne(this.createKeyCommandName(name), file);
	}

	/**
	 * @deprecated Backing store of the require('nativescript') surface.
	 * Do not add new entries through it.
	 */
	public publicApi: any = {
		__modules__: {},
	};

	/**
	 * @deprecated Legacy public-API builder.
	 */
	public requirePublic(names: any, file: string): void {
		forEachName(names, (name) => {
			this.requireOne(name, file);
			this.resolvePublicApi(name, file);
		});
	}

	/**
	 * @deprecated Legacy public-API builder.
	 */
	public requirePublicClass(names: any, file: string): void {
		forEachName(names, (name) => {
			this.requireOne(name, file);
			this.addClassToPublicApi(name, file);
		});
	}

	private addClassToPublicApi(name: string, file: string): void {
		Object.defineProperty(this.publicApi, name, {
			get: () => {
				return this.resolveInstance(name);
			},
		});
	}

	private resolvePublicApi(name: string, file: string): void {
		Object.defineProperty(this.publicApi, name, {
			get: () => {
				this.resolveInstance(name);
				return this.publicApi.__modules__[name];
			},
		});
	}

	private resolveInstance(name: string): any {
		let classInstance = this.peek(name);
		if (!classInstance) {
			classInstance = this.resolve(name);
		}

		return classInstance;
	}

	private requireOne(name: string, file: string): void {
		const relativePath = path.join("../", file);
		const dependencyPath = require("fs").existsSync(
			path.join(__dirname, relativePath + ".js"),
		)
			? relativePath
			: file;

		if (!this.has(name) || this.overrideAlreadyRequiredModule) {
			// Yok replaced the whole record on an allowed re-require, dropping any
			// resolver and cached instances with it — preserved via remove().
			this.remove(name);
			super.register({
				provide: name,
				useLazyRequire: () => require(dependencyPath),
			});
		} else {
			throw new Error(`module '${name}' require'd twice.`);
		}
	}

	/**
	 * @deprecated Slated for replacement by defineCommand and manifest-declared
	 * commands.
	 */
	public registerCommand(names: any, resolver: any): void {
		forEachName(names, (name) => {
			const commands = name.split(CommandsDelimiters.HierarchicalCommand);
			this.register(this.createCommandName(name), resolver);

			if (commands.length > 1) {
				const parentCommandName = commands[0];
				const subCommandName = _.tail(commands).join(
					CommandsDelimiters.HierarchicalCommand,
				);

				if (!this.hierarchicalCommands[parentCommandName]) {
					this.hierarchicalCommands[parentCommandName] = [];
				}

				// Guarded: the legacy flow reaches here twice for one command —
				// requireCommand records the subcommand, then the required module
				// registers itself through this method.
				if (
					!_.includes(
						this.hierarchicalCommands[parentCommandName],
						subCommandName,
					)
				) {
					this.hierarchicalCommands[parentCommandName].push(subCommandName);
				}

				this.createHierarchicalCommand(parentCommandName, name);
			}
		});
	}

	/**
	 * @deprecated Replaced together with the command registry.
	 */
	public registerKeyCommand(name: IValidKeyName, resolver: IKeyCommand): void {
		this.register(this.createKeyCommandName(name), resolver);
	}

	private getDefaultCommand(name: string, commandArguments: string[]) {
		const subCommands = this.hierarchicalCommands[name];
		const defaultCommand = _.find(subCommands, (command) =>
			_.some(command.split(CommandsDelimiters.HierarchicalCommand), (c) =>
				_.startsWith(c, CommandsDelimiters.DefaultCommandSymbol),
			),
		);

		return defaultCommand;
	}

	/**
	 * @deprecated Hierarchical-routing internals of the legacy command registry;
	 * they move out of the container with the defineCommand work.
	 */
	public buildHierarchicalCommand(
		parentCommandName: string,
		commandLineArguments: string[],
	): any {
		let currentSubCommandName: string,
			finalSubCommandName: string,
			matchingSubCommandName: string;
		const subCommands = this.hierarchicalCommands[parentCommandName];
		let remainingArguments = commandLineArguments;
		let finalRemainingArguments = commandLineArguments;
		_.each(commandLineArguments, (arg) => {
			arg = arg.toLowerCase();
			currentSubCommandName = currentSubCommandName
				? this.getHierarchicalCommandName(currentSubCommandName, arg)
				: arg;
			remainingArguments = _.tail(remainingArguments);
			if (
				(matchingSubCommandName = _.find(
					subCommands,
					(sc) =>
						sc === currentSubCommandName ||
						sc ===
							`${CommandsDelimiters.DefaultCommandSymbol}${currentSubCommandName}`,
				))
			) {
				finalSubCommandName = matchingSubCommandName;
				finalRemainingArguments = remainingArguments;
			}
		});

		if (!finalSubCommandName) {
			finalSubCommandName =
				this.getDefaultCommand(parentCommandName, commandLineArguments) || "";
			finalRemainingArguments = _.difference(
				commandLineArguments,
				finalSubCommandName
					.split(CommandsDelimiters.HierarchicalCommand)
					.map((command) =>
						_.startsWith(command, CommandsDelimiters.DefaultCommandSymbol)
							? command.slice(1)
							: command,
					),
			);
		}

		if (finalSubCommandName) {
			return {
				commandName: this.getHierarchicalCommandName(
					parentCommandName,
					finalSubCommandName,
				),
				remainingArguments: finalRemainingArguments,
			};
		}
	}

	private createHierarchicalCommand(name: string, triggeredBy?: string) {
		if (
			this.has(this.createCommandName(name)) &&
			!this.synthesizedParents.has(name) &&
			!this.placeholderParents.has(name)
		) {
			// Overwriting would make the registered command unreachable, which is
			// strictly worse than leaving the subcommand unrouted.
			const logger = this.get("logger", { optional: true });
			if (logger) {
				logger.warn(
					`'${name}' is already registered as a command of its own, so no ` +
						`subcommand dispatcher was created for it${
							triggeredBy ? ` and '${triggeredBy}' cannot be reached` : ""
						}. Rename one of the two.`,
				);
			}

			return;
		}

		this.synthesizedParents.add(name);
		const factory = () => {
			return {
				disableAnalytics: true,
				isHierarchicalCommand: true,
				execute: async (args: string[]): Promise<void> => {
					const commandsService = this.resolve("commandsService");
					let commandName: string = null;
					const defaultCommand = this.getDefaultCommand(name, args);
					let commandArguments: ICommandArgument[] = [];

					if (args.length > 0) {
						const hierarchicalCommand = this.buildHierarchicalCommand(
							name,
							args,
						);
						if (hierarchicalCommand) {
							commandName = hierarchicalCommand.commandName;
							commandArguments = hierarchicalCommand.remainingArguments;
						} else {
							commandName = defaultCommand
								? this.getHierarchicalCommandName(name, defaultCommand)
								: "help";
							// If we'll execute the default command, but it's full name had been written by the user
							// for example "ns run ios", we have to remove the "ios" option from the arguments that we'll pass to the command.
							if (
								_.includes(
									this.hierarchicalCommands[name],
									CommandsDelimiters.DefaultCommandSymbol + args[0],
								)
							) {
								commandArguments = _.tail(args);
							} else {
								commandArguments = args;
							}
						}
					} else {
						//Execute only default command without arguments
						if (defaultCommand) {
							commandName = this.getHierarchicalCommandName(
								name,
								defaultCommand,
							);
						} else {
							commandName = "help";

							// Show command-line help
							const options = this.resolve("options");
							options.help = true;
						}
					}

					await commandsService.tryExecuteCommand(
						commandName,
						commandName === "help" ? [name] : commandArguments,
					);
				},
			};
		};

		this.registerCommand(name, factory);
	}

	private getHierarchicalCommandName(
		parentCommandName: string,
		subCommandName: string,
	) {
		return [parentCommandName, subCommandName].join(
			CommandsDelimiters.HierarchicalCommand,
		);
	}

	/**
	 * @deprecated Legacy command-registry routing.
	 * Side-effecting: fails with help output on a bad subcommand.
	 */
	public async isValidHierarchicalCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean> {
		if (_.includes(Object.keys(this.hierarchicalCommands), commandName)) {
			const subCommands = this.hierarchicalCommands[commandName];
			if (subCommands) {
				const fullCommandName = this.buildHierarchicalCommand(
					commandName,
					commandArguments,
				);
				if (!fullCommandName) {
					// In case buildHierarchicalCommand doesn't find a valid command
					// there isn't a valid command or default with those arguments

					const errors = this.resolve("errors");
					errors.failWithHelp(ERROR_NO_VALID_SUBCOMMAND_FORMAT, commandName);
				}

				return true;
			}
		}

		return false;
	}

	/**
	 * @deprecated Legacy command-registry routing.
	 */
	public isDefaultCommand(commandName: string): boolean {
		return (
			commandName.indexOf(CommandsDelimiters.DefaultCommandSymbol) > 0 &&
			commandName.indexOf(CommandsDelimiters.HierarchicalCommand) > 0
		);
	}

	/**
	 * @deprecated Legacy name-based registration. Use a Provider (the overload
	 * below) or provide(); a contract's token name keeps string spellings
	 * resolvable.
	 */
	public register(name: string, resolver: any, shared?: boolean): void;
	public register(providers: Provider | Provider[]): void;
	public register(
		nameOrProviders: string | Provider | Provider[],
		resolver?: any,
		shared?: boolean,
	): void {
		if (typeof nameOrProviders !== "string") {
			super.register(nameOrProviders);
			return;
		}

		shared = shared === undefined ? true : shared;
		if (_.isFunction(resolver)) {
			if (resolver.length === 0 && !resolver.prototype) {
				// A prototype-less zero-parameter function (an arrow factory) cannot
				// be `new`ed and has no parameters to resolve, so annotate() would
				// contribute nothing — register it as a plain factory.
				super.register({
					provide: nameOrProviders,
					useFactory: <() => any>resolver,
					shared,
				});
				return;
			}

			// Classes and factory functions alike: the legacy provider kind
			// annotate()s the resolver and calls or news it by casing.
			super.register({
				provide: nameOrProviders,
				useLegacyClass: resolver,
				shared,
			});
		} else {
			super.register({ provide: nameOrProviders, useValue: resolver, shared });
		}
	}

	/**
	 * @deprecated Legacy command-registry lookup.
	 */
	public resolveCommand(name: string): ICommand {
		let command: ICommand;
		const commandModuleName = this.createCommandName(name);
		if (!this.has(commandModuleName)) {
			return null;
		}
		command = this.resolve(commandModuleName);

		return command;
	}

	/**
	 * @deprecated Legacy command-registry lookup.
	 */
	public resolveKeyCommand(name: string): IKeyCommand {
		let command: IKeyCommand;
		const commandModuleName = this.createKeyCommandName(name);
		if (!this.has(commandModuleName)) {
			return null;
		}

		command = this.resolve(commandModuleName);

		return command;
	}

	/**
	 * @deprecated Use inject(Token) in an injection context, or Injector.get /
	 * createInstance from lib/common/di (via `Yok.di`).
	 */
	public resolve(param: any, ctorArguments?: IDictionary<any>): any {
		if (_.isFunction(param)) {
			// By-class resolution is transient and never retained — Yok did not
			// track these instances for disposal either.
			return this.createInstance(<Function>param, [], ctorArguments);
		}
		return this.getWithLegacyArguments(<string>param, ctorArguments);
	}

	/* Regex to match dynamic calls in the following format:
		#{moduleName.functionName} or
		#{moduleName.functionName(param1)} or
		#{moduleName.functionName(param1, param2)} - multiple parameters separated with comma are supported
		Check dynamicCall method for sample usage of this regular expression and see how to determine the passed parameters
	*/
	/**
	 * @deprecated String-reflective help templating; removable only together with
	 * the help-template pipeline. Usage is
	 * runtime-traced via reportDeprecation.
	 */
	public get dynamicCallRegex(): RegExp {
		return /#{([^.]+)\.([^}]+?)(\((.+)\))*}/;
	}

	/**
	 * @deprecated See dynamicCallRegex.
	 */
	public getDynamicCallData(call: string, args?: any[]): any {
		reportDeprecation({ api: "injector.dynamicCall", detail: call });
		const parsed = call.match(this.dynamicCallRegex);
		const module = this.resolve(parsed[1]);
		if (!args && parsed[3]) {
			args = _.map(parsed[4].split(","), (arg) => arg.trim());
		}

		return module[parsed[2]].apply(module, args);
	}

	/**
	 * @deprecated See dynamicCallRegex.
	 */
	public async dynamicCall(call: string, args?: any[]): Promise<any> {
		const data = this.getDynamicCallData(call, args);

		if (isPromise(data)) {
			return await data;
		}

		return data;
	}

	/**
	 * @deprecated Legacy command-registry enumeration; feeds shell autocompletion
	 * and help, so the `|` encoding is user-visible.
	 */
	public getRegisteredCommandsNames(includeDev: boolean): string[] {
		const commandsNames = this.getRegisteredNames(
			`${this.COMMANDS_NAMESPACE}.`,
		);
		let commands = _.map(commandsNames, (commandName: string) =>
			commandName.slice(this.COMMANDS_NAMESPACE.length + 1),
		);
		if (!includeDev) {
			commands = _.reject(commands, (command) => _.startsWith(command, "dev-"));
		}
		return commands;
	}

	/**
	 * @deprecated Legacy command-registry enumeration.
	 */
	public getRegisteredKeyCommandsNames(): string[] {
		const commandsNames = this.getRegisteredNames(
			`${this.KEY_COMMANDS_NAMESPACE}.`,
		);
		const commands = _.map(commandsNames, (commandName: string) =>
			commandName.slice(this.KEY_COMMANDS_NAMESPACE.length + 1),
		);
		return commands;
	}

	/**
	 * @deprecated Legacy command-registry routing.
	 */
	public getChildrenCommandsNames(commandName: string): string[] {
		return this.hierarchicalCommands[commandName];
	}

	private createCommandName(name: string) {
		return `${this.COMMANDS_NAMESPACE}.${name}`;
	}

	private createKeyCommandName(name: string) {
		return `${this.KEY_COMMANDS_NAMESPACE}.${name}`;
	}

	/**
	 * @deprecated Delegates to Injector.dispose (reverse instantiation order);
	 * new code disposes the di container directly.
	 */
	public dispose(exclude: any[] = []): void {
		super.dispose([this, ...exclude]);
	}
}

// The global is the published legacy surface. It is an accessor pair so a
// direct `global.$injector = x` assignment — allowed for third parties —
// stays synchronized with the module binding that getInjector() and internal
// code read; a plain data property would silently fork the two.
injector = (<any>global).$injector || new Yok();
Object.defineProperty(global, "$injector", {
	get: () => injector,
	set: (value: IInjector) => {
		injector = value;
	},
	configurable: true,
});

/**
 * Accessor for the process-wide facade, for code that cannot receive the
 * injector through DI or a static import (import cycles, decorator bodies).
 * Prefer inject(Injector) in an injection context; prefer a constructor
 * dependency in services. Never read global.$injector directly — the global
 * exists only as the published legacy surface for extensions and hooks.
 */
export function getInjector(): IInjector {
	return injector;
}

/**
 * @deprecated Global-singleton wiring for the legacy facade; new code receives
 * the container via inject(Injector) instead of a process-wide global.
 */
export function setGlobalInjector(inj: IInjector): IInjector {
	injector = inj;
	(<any>global).$injector = inj;
	return inj;
}
