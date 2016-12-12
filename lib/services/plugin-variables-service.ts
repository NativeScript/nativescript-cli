import * as helpers from "./../common/helpers";

export class PluginVariablesService implements IPluginVariablesService {
	private static PLUGIN_VARIABLES_KEY = "variables";

	constructor(private $errors: IErrors,
		private $pluginVariablesHelper: IPluginVariablesHelper,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $fs: IFileSystem) { }

	public getPluginVariablePropertyName(pluginName: string): string {
		return `${pluginName}-${PluginVariablesService.PLUGIN_VARIABLES_KEY}`;
	}

	public savePluginVariablesInProjectFile(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let values = Object.create(null);
			this.executeForAllPluginVariables(pluginData, (pluginVariableData: IPluginVariableData) => {
				let pluginVariableValue = this.getPluginVariableValue(pluginVariableData).wait();
				this.ensurePluginVariableValue(pluginVariableValue, `Unable to find value for ${pluginVariableData.name} plugin variable from ${pluginData.name} plugin. Ensure the --var option is specified or the plugin variable has default value.`);
				values[pluginVariableData.name] = pluginVariableValue;
			});

			if (!_.isEmpty(values)) {
				this.$projectDataService.initialize(this.$projectData.projectDir);
				this.$projectDataService.setValue(this.getPluginVariablePropertyName(pluginData.name), values);
			}
		}).future<void>()();
	}

	public removePluginVariablesFromProjectFile(pluginName: string): void {
		this.$projectDataService.initialize(this.$projectData.projectDir);
		this.$projectDataService.removeProperty(this.getPluginVariablePropertyName(pluginName));
	}

	public interpolatePluginVariables(pluginData: IPluginData, pluginConfigurationFilePath: string): IFuture<void> {
		return (() => {
			let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
			this.executeForAllPluginVariables(pluginData, (pluginVariableData: IPluginVariableData) => {
				this.ensurePluginVariableValue(pluginVariableData.value, `Unable to find the value for ${pluginVariableData.name} plugin variable into project package.json file. Verify that your package.json file is correct and try again.`);
				pluginConfigurationFileContent = this.interpolateCore(pluginVariableData.name, pluginVariableData.value, pluginConfigurationFileContent);
			});
			this.$fs.writeFile(pluginConfigurationFilePath, pluginConfigurationFileContent);
		}).future<void>()();
	}

	public interpolateAppIdentifier(pluginConfigurationFilePath: string): void {
		let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
		let newContent = this.interpolateCore("nativescript.id", this.$projectData.projectId, pluginConfigurationFileContent);
		this.$fs.writeFile(pluginConfigurationFilePath, newContent);
	}

	public interpolate(pluginData: IPluginData, pluginConfigurationFilePath: string): IFuture<void> {
		return (() => {
			this.interpolatePluginVariables(pluginData, pluginConfigurationFilePath).wait();
			this.interpolateAppIdentifier(pluginConfigurationFilePath);
		}).future<void>()();
	}

	private interpolateCore(name: string, value: string, content: string): string {
		return content.replace(new RegExp(`{${name}}`, "gi"), value);
	}

	private ensurePluginVariableValue(pluginVariableValue: string, errorMessage: string): void {
		if (!pluginVariableValue) {
			this.$errors.failWithoutHelp(errorMessage);
		}
	}

	private getPluginVariableValue(pluginVariableData: IPluginVariableData): IFuture<string> {
		return (() => {
			let pluginVariableName = pluginVariableData.name;
			let value = this.$pluginVariablesHelper.getPluginVariableFromVarOption(pluginVariableName);
			if (value) {
				value = value[pluginVariableName];
			} else {
				value = pluginVariableData.defaultValue;
				if (!value && helpers.isInteractive()) {
					let promptSchema = {
						name: pluginVariableName,
						type: "input",
						message: `Enter value for ${pluginVariableName} variable:`,
						validate: (val: string) => !!val ? true : 'Please enter a value!'
					};
					let promptData = this.$prompter.get([promptSchema]).wait();
					value = promptData[pluginVariableName];
				}
			}

			return value;
		}).future<string>()();
	}

	private executeForAllPluginVariables(pluginData: IPluginData, action: (pluginVariableData: IPluginVariableData) => void): void {
		let pluginVariables = pluginData.pluginVariables;
		let pluginVariablesNames = _.keys(pluginVariables);
		_.each(pluginVariablesNames, pluginVariableName => action(this.createPluginVariableData(pluginData, pluginVariableName)));
	}

	private createPluginVariableData(pluginData: IPluginData, pluginVariableName: string): IPluginVariableData {
		let variableData = pluginData.pluginVariables[pluginVariableName];

		variableData.name = pluginVariableName;

		this.$projectDataService.initialize(this.$projectData.projectDir);
		let pluginVariableValues = this.$projectDataService.getValue(this.getPluginVariablePropertyName(pluginData.name));
		variableData.value = pluginVariableValues ? pluginVariableValues[pluginVariableName] : undefined;

		return variableData;
	}
}
$injector.register("pluginVariablesService", PluginVariablesService);
