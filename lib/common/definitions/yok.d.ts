import { IDisposable, IDictionary } from "../declarations";
import { ICommand } from "./commands";

interface IInjector extends IDisposable {
	require(name: string, file: string): void;
	require(names: string[], file: string): void;
	requirePublic(names: string | string[], file: string): void;
	requirePublicClass(names: string | string[], file: string): void;
	requireCommand(name: string, file: string): void;
	requireCommand(names: string[], file: string): void;
	/**
	 * Resolves an implementation by constructor function.
	 * The injector will create new instances for every call.
	 */
	resolve(ctor: Function, ctorArguments?: { [key: string]: any }): any;
	resolve<T>(ctor: Function, ctorArguments?: { [key: string]: any }): T;
	/**
	 * Resolves an implementation by name.
	 * The injector will create only one instance per name and return the same instance on subsequent calls.
	 */
	resolve(name: string, ctorArguments?: IDictionary<any>): any;
	resolve<T>(name: string, ctorArguments?: IDictionary<any>): T;

	resolveCommand(name: string): ICommand;
	register(name: string, resolver: any, shared?: boolean): void;
	registerCommand(name: string, resolver: any): void;
	registerCommand(names: string[], resolver: any): void;
	getRegisteredCommandsNames(includeDev: boolean): string[];
	dynamicCallRegex: RegExp;
	dynamicCall(call: string, args?: any[]): Promise<any>;
	isDefaultCommand(commandName: string): boolean;
	isValidHierarchicalCommand(
		commandName: string,
		commandArguments: string[]
	): Promise<boolean>;
	getChildrenCommandsNames(commandName: string): string[];
	buildHierarchicalCommand(
		parentCommandName: string,
		commandLineArguments: string[]
	): any;
	publicApi: any;

	/**
	 * Defines if it's allowed to override already required module.
	 * This can be used in order to allow redefinition of modules, for example $logger can be replaced by a plugin.
	 * Default value is false.
	 */
	overrideAlreadyRequiredModule: boolean;
}

declare var $injector: IInjector;
