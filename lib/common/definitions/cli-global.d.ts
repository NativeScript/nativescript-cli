/**
 * Defines additional properties added to global object from CLI.
 */
interface ICliGlobal extends NodeJS.Global {
	/**
	 * Lodash instance.
	 */
	_: any;

	/**
	 * Eqatec analytics instance.
	 */
	_eqatec: IEqatec;

	/**
	 * Global instance of the module used for dependency injection.
	 */
	$injector: IInjector;

	/**
	 * Instance of xmlhttprequest.
	 */
	XMLHttpRequest: any;
}
