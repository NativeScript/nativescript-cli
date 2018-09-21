
interface ICommand extends ICommandOptions {
	execute(args: string[]): Promise<void>;
	allowedParameters: ICommandParameter[];

	isDisabled?: boolean;

	// Implement this method in cases when you want to have your own logic for validation. In case you do not implement it,
	// the command will be evaluated from CommandsService's canExecuteCommand method.
	// One possible case where you can use this method is when you have two commandParameters, neither of them is mandatory,
	// but at least one of them is required. Used in prop|add, prop|set, etc. commands as their logic is complicated and
	// default validation in CommandsService is not applicable.
	canExecute?(args: string[]): Promise<boolean | ICanExecuteCommandOutput>;
	completionData?: string[];
	dashedOptions?: IDictionary<IDashedOption>;
	isHierarchicalCommand?: boolean;

	/**
	 * Describes the action that will be executed after the command succeeds.
	 * @param {string[]} args Arguments passed to the command.
	 * @returns {Promise<void>}
	 */
	postCommandAction?(args: string[]): Promise<void>;
}

interface ICanExecuteCommandOutput {
	canExecute: boolean;
	/**
	 * In case when canExecute method returns false, the help of the command is printed.
	 * In case when canExecute method returns false and suppressCommandHelp is true, the command's help will not be printed.
	 */
	suppressCommandHelp?: boolean;
}

interface ICanExecuteCommandOptions {
	validateOptions?: boolean;
	notConfiguredEnvOptions?: INotConfiguredEnvOptions;
}

interface INotConfiguredEnvOptions {
	hideSyncToPreviewAppOption?: boolean;
	hideCloudBuildOption?: boolean;
}

interface IDynamicCommand extends ICommand { }

interface ISimilarCommand {
	name: string;
	rating: number;
}

interface ICommandArgument { }

interface ICommandParameter {
	mandatory: boolean;
	errorMessage?: string
	validate(value: string, errorMessage?: string): Promise<boolean>;
}

interface IStringParameterBuilder {
	createMandatoryParameter(errorMsg: string): ICommandParameter;
}
