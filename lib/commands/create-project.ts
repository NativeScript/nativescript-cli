import * as constants from "../constants";

export class CreateProjectCommand implements ICommand {
	constructor(private $projectService: IProjectService,
		private $errors: IErrors,
		private $options: IOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public enableHooks = false;

	execute(args: string[]): IFuture<void> {
		return (() => {
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

			this.$projectService.createProject(args[0], selectedTemplate).wait();
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Project name cannot be empty.")];
}

$injector.registerCommand("create", CreateProjectCommand);
