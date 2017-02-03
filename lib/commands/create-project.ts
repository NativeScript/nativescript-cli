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

		await this.$projectService.createProject({
			projectName: args[0],
			template: selectedTemplate,
			appId: this.$options.appid,
			pathToProject: this.$options.path,
			force: this.$options.force,
			ignoreScripts: this.$options.ignoreScripts
		});
	}
}

$injector.registerCommand("create", CreateProjectCommand);
