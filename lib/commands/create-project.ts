import * as constants from "../constants";

export class CreateProjectCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Project name cannot be empty.")];

	constructor(private $projectService: IProjectService,
		private $errors: IErrors,
		private $options: IOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public async execute(args: string[]): Promise<void> {
		if ((this.$options.tsc || this.$options.ng) && this.$options.template) {
			this.$errors.fail("You cannot use --ng or --tsc options together with --template.");
		}

		let selectedTemplate: string;
		if (this.$options.tsc) {
			selectedTemplate = constants.TYPESCRIPT_NAME;
		} else if (this.$options.ng) {
			selectedTemplate = constants.ANGULAR_NAME;
		} else {
			selectedTemplate = this.$options.template;
		}

		await this.$projectService.createProject(args[0], selectedTemplate);
	}
}

$injector.registerCommand("create", CreateProjectCommand);
