/**
 * Describes methods available in the require.
 */
interface IRequireService {
	/**
	 * Wrapper for the Node.js `require` method.
	 * @param {string} module Module to be required.
	 * @returns {any} The result of the require action.
	 */
	require(module: string): any;
}
