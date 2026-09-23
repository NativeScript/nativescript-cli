import { IDictionary } from "../declarations";
import { Injector } from "../di/injector";
import { Provider } from "../di/providers";
import { CommandRegistry } from "../contracts/command-registry";
import { KeyCommandRegistry } from "../contracts/key-command-registry";
import { ModuleRegistry } from "../contracts/module-registry";
import { PublicApiBuilder } from "../contracts/public-api-builder";

/**
 * The legacy injector facade surface. It extends the token-based `Injector` —
 * the facade IS an injector — and adds the legacy subsystems, whose members
 * are individually @deprecated. Only the `Yok` class hierarchy implements
 * this; the interface survives until the hook/extension deprecation completes.
 */
interface IInjector
	extends
		Injector,
		CommandRegistry,
		KeyCommandRegistry,
		ModuleRegistry,
		PublicApiBuilder {
	/**
	 * Resolves an implementation by constructor function.
	 * The injector will create new instances for every call.
	 * @deprecated Use Injector.createInstance.
	 */
	resolve(ctor: Function, ctorArguments?: { [key: string]: any }): any;
	/**
	 * @deprecated Use Injector.createInstance.
	 */
	resolve<T>(ctor: Function, ctorArguments?: { [key: string]: any }): T;
	/**
	 * Resolves an implementation by name.
	 * The injector will create only one instance per name and return the same instance on subsequent calls.
	 * @deprecated Use inject(Token) in an injection context, or Injector.get.
	 */
	resolve(name: string, ctorArguments?: IDictionary<any>): any;
	/**
	 * @deprecated Use inject(Token) in an injection context, or Injector.get.
	 */
	resolve<T>(name: string, ctorArguments?: IDictionary<any>): T;

	/**
	 * @deprecated Legacy name-based registration. Use the Provider overload or
	 * provide(); a contract's token name keeps string spellings resolvable.
	 */
	register(name: string, resolver: any, shared?: boolean): void;
	register(providers: Provider | Provider[]): void;
	/**
	 * @deprecated String-reflective help templating; removable only together
	 * with the help-template pipeline.
	 */
	dynamicCallRegex: RegExp;
	/**
	 * @deprecated See dynamicCallRegex.
	 */
	dynamicCall(call: string, args?: any[]): Promise<any>;
}

/**
 * @deprecated The process-wide legacy injector global. New code receives the
 * container via inject(Injector) from lib/common/di.
 */
declare var $injector: IInjector;
