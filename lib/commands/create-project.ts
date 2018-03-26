import * as constants from "../constants";
import * as path from "path";

export class CreateProjectCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Project name cannot be empty.")];

	private createdProjecData: ICreateProjectData;

	constructor(private $projectService: IProjectService,
		private $logger: ILogger,
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

		this.createdProjecData = await this.$projectService.createProject({
			projectName: args[0],
			template: selectedTemplate,
			appId: this.$options.appid,
			pathToProject: this.$options.path,
			force: this.$options.force,
			ignoreScripts: this.$options.ignoreScripts
		});
	}

	public async postCommandAction(args: string[]): Promise<void> {
		const { projectDir } = this.createdProjecData;
		const relativePath = path.relative(process.cwd(), projectDir);
		this.$logger.printMarkdown(`Now you can navigate to your project with \`$ cd ${relativePath}\``);
		this.$logger.printMarkdown(`After that you can run it on device/emulator by executing \`$ tns run <platform>\``);
	}
}

$injector.registerCommand("create", CreateProjectCommand);
