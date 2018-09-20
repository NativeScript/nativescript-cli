import * as helpers from "./../common/helpers";

export class PluginVariablesService implements IPluginVariablesService {
	private static PLUGIN_VARIABLES_KEY = "variables";

	constructor(private $errors: IErrors,
		private $pluginVariablesHelper: IPluginVariablesHelper,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $fs: IFileSystem) { }

	public getPluginVariablePropertyName(pluginName: string): string {
		return `${pluginName}-${PluginVariablesService.PLUGIN_VARIABLES_KEY}`;
	}

	public async savePluginVariablesInProjectFile(pluginData: IPluginData, projectDir: string): Promise<void> {
		const values = Object.create(null);
		await this.executeForAllPluginVariables(pluginData, async (pluginVariableData: IPluginVariableData) => {
			const pluginVariableValue = await this.getPluginVariableValue(pluginVariableData);
			this.ensurePluginVariableValue(pluginVariableValue, `Unable to find value for ${pluginVariableData.name} plugin variable from ${pluginData.name} plugin. Ensure the --var option is specified or the plugin variable has default value.`);
			values[pluginVariableData.name] = pluginVariableValue;
		}, projectDir);

		if (!_.isEmpty(values)) {
			this.$projectDataService.setNSValue(projectDir, this.getPluginVariablePropertyName(pluginData.name), values);
		}
	}

	public removePluginVariablesFromProjectFile(pluginName: string, projectDir: string): void {
		this.$projectDataService.removeNSProperty(projectDir, this.getPluginVariablePropertyName(pluginName));
	}

	public async interpolatePluginVariables(pluginData: IPluginData, pluginConfigurationFilePath: string, projectDir: string): Promise<void> {
		let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
		await this.executeForAllPluginVariables(pluginData, async (pluginVariableData: IPluginVariableData) => {
			this.ensurePluginVariableValue(pluginVariableData.value, `Unable to find the value for ${pluginVariableData.name} plugin variable into project package.json file. Verify that your package.json file is correct and try again.`);
			pluginConfigurationFileContent = this.interpolateCore(pluginVariableData.name, pluginVariableData.value, pluginConfigurationFileContent);
		}, projectDir);

		this.$fs.writeFile(pluginConfigurationFilePath, pluginConfigurationFileContent);
	}

	public interpolateAppIdentifier(pluginConfigurationFilePath: string, projectIdentifier: string): void {
		const pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
		const newContent = this.interpolateCore("nativescript.id", projectIdentifier, pluginConfigurationFileContent);
		this.$fs.writeFile(pluginConfigurationFilePath, newContent);
	}

	public async interpolate(pluginData: IPluginData, pluginConfigurationFilePath: string, projectDir: string, projectIdentifier: string): Promise<void> {
		await this.interpolatePluginVariables(pluginData, pluginConfigurationFilePath, projectDir);
		this.interpolateAppIdentifier(pluginConfigurationFilePath, projectIdentifier);
	}

	private interpolateCore(name: string, value: string, content: string): string {
		return content.replace(new RegExp(`{${name}}`, "gi"), value);
	}

	private ensurePluginVariableValue(pluginVariableValue: string, errorMessage: string): void {
		if (!pluginVariableValue) {
			this.$errors.failWithoutHelp(errorMessage);
		}
	}

	private async getPluginVariableValue(pluginVariableData: IPluginVariableData): Promise<string> {
		const pluginVariableName = pluginVariableData.name;
		let value = this.$pluginVariablesHelper.getPluginVariableFromVarOption(pluginVariableName);
		if (value) {
			value = value[pluginVariableName];
		} else {
			value = pluginVariableData.defaultValue;
			if (!value && helpers.isInteractive()) {
				const promptSchema = {
					name: pluginVariableName,
					type: "input",
					message: `Enter value for ${pluginVariableName} variable:`,
					validate: (val: string) => !!val ? true : 'Please enter a value!'
				};
				const promptData = await this.$prompter.get([promptSchema]);
				value = promptData[pluginVariableName];
			}
		}

		return value;
	}

	private async executeForAllPluginVariables(pluginData: IPluginData, action: (pluginVariableData: IPluginVariableData) => Promise<void>, projectDir: string): Promise<void> {
		const pluginVariables = pluginData.pluginVariables;
		const pluginVariablesNames = _.keys(pluginVariables);
		await Promise.all(_.map(pluginVariablesNames, pluginVariableName => action(this.createPluginVariableData(pluginData, pluginVariableName, projectDir))));
	}

	private createPluginVariableData(pluginData: IPluginData, pluginVariableName: string, projectDir: string): IPluginVariableData {
		const variableData = pluginData.pluginVariables[pluginVariableName];

		variableData.name = pluginVariableName;

		const pluginVariableValues = this.$projectDataService.getNSValue(projectDir, this.getPluginVariablePropertyName(pluginData.name));
		variableData.value = pluginVariableValues ? pluginVariableValues[pluginVariableName] : undefined;

		return variableData;
	}
}

$injector.register("pluginVariablesService", PluginVariablesService);
