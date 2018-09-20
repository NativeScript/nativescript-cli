export class PluginVariablesHelper implements IPluginVariablesHelper {
	constructor(private $options: ICommonOptions) { }

	/**
	 * Checks if the specified pluginVariable exists in the --var option specified by user.
	 * The variable can be added to --var option for configuration or globally, for ex.:
	 * `--var.APP_ID myAppIdentifier` or `--var.debug.APP_ID myAppIdentifier`.
	 * NOTE: If the variable is added for specific configuration and globally,
	 * the value for the specified configuration will be used as it has higher priority. For ex.:
	 * `--var.APP_ID myAppIdentifier1 --var.debug.APP_ID myAppIdentifier2` will return myAppIdentifier2 for debug configuration
	 * and myAppIdentifier for release configuration.
	 * @param {string} variableName The name of the plugin variable.
	 * @param {string} configuration The configuration for which the variable will be used.
	 * @returns {any} The value of the plugin variable specified in --var or undefined.
	 */
	public getPluginVariableFromVarOption(variableName: string, configuration?: string): any {
		let varOption = this.$options.var;
		configuration = configuration ? configuration.toLowerCase() : undefined;
		const lowerCasedVariableName = variableName.toLowerCase();
		if (varOption) {
			let configVariableValue: string;
			let generalVariableValue: string;
			if (variableName.indexOf(".") !== -1) {
				varOption = this.simplifyYargsObject(varOption, configuration);
			}
			_.each(varOption, (propValue: any, propKey: string) => {
				if (propKey.toLowerCase() === configuration) {
					_.each(propValue, (configPropValue: string, configPropKey: string) => {
						if (configPropKey.toLowerCase() === lowerCasedVariableName) {
							configVariableValue = configPropValue;
							return false;
						}
					});
				} else if (propKey.toLowerCase() === lowerCasedVariableName) {
					generalVariableValue = propValue;
				}
			});

			const value = configVariableValue || generalVariableValue;
			if (value) {
				const obj = Object.create(null);
				obj[variableName] = value.toString();
				return obj;
			}
		}

		return undefined;
	}

	/**
	 * Converts complicated yargs object with many subobjects, to simplified one.
	 * Use it when the plugin variable contains dots ("."). In this case yargs treats them as inner object instead of propery name.
	 * For ex. '--var.debug.DATA.APP.ID testId' will be converted to {debug: {DATA: {APP: {ID: testId}}}}, while we need {debug: {DATA.APP.ID: testId}}
	 * '--var.DATA.APP.ID testId' will be converted to DATA: {APP: {ID: testId}}}, while we need {DATA.APP.ID: testId}
	 * @param {any} obj varObject created by yargs
	 * @param {string} configuration The configuration for which the plugin variable will be used.
	 * @return {any} Converted object if the obj paramater is of type object, otherwise - the object itself.
	 */
	public simplifyYargsObject(obj: any, configuration?: string): any {
		if (obj && typeof (obj) === "object") {
			const convertedObject: any = Object.create({});

			_.each(obj, (propValue: any, propKey: string) => {
				if (typeof (propValue) !== "object") {
					convertedObject[propKey] = propValue;
					return false;
				}

				configuration = configuration ? configuration.toLowerCase() : undefined;
				const innerObj = this.simplifyYargsObject(propValue, configuration);

				if (propKey.toLowerCase() === configuration) {
					// for --var.debug.DATA.APP.ID testId
					convertedObject[propKey] = innerObj;
				} else {
					// for --var.DATA.APP.ID testId
					_.each(innerObj, (innerPropValue: any, innerPropKey: string) => {
						convertedObject[`${propKey}.${innerPropKey}`] = innerPropValue;
					});
				}

			});

			return convertedObject;
		}

		return obj;
	}
}
$injector.register("pluginVariablesHelper", PluginVariablesHelper);
