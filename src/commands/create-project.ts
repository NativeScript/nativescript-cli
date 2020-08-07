import * as constants from "../constants";
import * as path from "path";
import { isInteractive } from "../common/helpers";

export class CreateProjectCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];
	private static BlankTemplateKey = "Blank";
	private static BlankTemplateDescription = "A blank app";
	private static HelloWorldTemplateKey = "Hello World";
	private static HelloWorldTemplateDescription = "A Hello World app";
	private static DrawerTemplateKey = "SideDrawer";
	private static DrawerTemplateDescription = "An app with pre-built pages that uses a drawer for navigation";
	private static TabsTemplateKey = "Tabs";
	private static TabsTemplateDescription = "An app with pre-built pages that uses tabs for navigation";
	private isInteractionIntroShown = false;

	private createdProjectData: ICreateProjectData;

	constructor(private $projectService: IProjectService,
		private $logger: ILogger,
		private $errors: IErrors,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $stringParameter: ICommandParameter) { }

	public async execute(args: string[]): Promise<void> {
		const interactiveAdverbs = ["First", "Next", "Finally"];
		const getNextInteractiveAdverb = () => {
			return interactiveAdverbs.shift() || "Next";
		};

		if ((this.$options.tsc || this.$options.ng || this.$options.vue || this.$options.js) && this.$options.template) {
			this.$errors.failWithHelp("You cannot use a flavor option like --ng, --vue, --tsc and --js together with --template.");
		}

		let projectName = args[0];
		let selectedTemplate: string;
		if (this.$options.js) {
			selectedTemplate = constants.JAVASCRIPT_NAME;
		} else if (this.$options.tsc) {
			selectedTemplate = constants.TYPESCRIPT_NAME;
		} else if (this.$options.ng) {
			selectedTemplate = constants.ANGULAR_NAME;
		} else if (this.$options.vue) {
			selectedTemplate = constants.VUE_NAME;
		} else if (this.$options.react) {
			selectedTemplate = constants.REACT_NAME;
		} else {
			selectedTemplate = this.$options.template;
		}

		if (!projectName && isInteractive()) {
			this.printInteractiveCreationIntroIfNeeded();
			projectName = await this.$prompter.getString(`${getNextInteractiveAdverb()}, what will be the name of your app?`, { allowEmpty: false });
			this.$logger.info();
		}

		projectName = await this.$projectService.validateProjectName({ projectName: projectName, force: this.$options.force, pathToProject: this.$options.path });

		if (!selectedTemplate && isInteractive()) {
			this.printInteractiveCreationIntroIfNeeded();
			selectedTemplate = await this.interactiveFlavorAndTemplateSelection(getNextInteractiveAdverb(), getNextInteractiveAdverb());
		}

		this.createdProjectData = await this.$projectService.createProject({
			projectName: projectName,
			template: selectedTemplate,
			appId: this.$options.appid,
			pathToProject: this.$options.path,
			// its already validated above
			force: true,
			ignoreScripts: this.$options.ignoreScripts
		});
	}

	private async interactiveFlavorAndTemplateSelection(flavorAdverb: string, templateAdverb: string) {
		const selectedFlavor = await this.interactiveFlavorSelection(flavorAdverb);
		const selectedTemplate: string = await this.interactiveTemplateSelection(selectedFlavor, templateAdverb);

		return selectedTemplate;
	}

	private async interactiveFlavorSelection(adverb: string) {
		const flavorSelection = await this.$prompter.promptForDetailedChoice(`${adverb}, which style of NativeScript project would you like to use:`, [
			{ key: constants.NgFlavorName, description: "Learn more at https://nativescript.org/angular" },
			{ key: constants.ReactFlavorName, description: "Learn more at https://github.com/shirakaba/react-nativescript" },
			{ key: constants.VueFlavorName, description: "Learn more at https://nativescript.org/vue" },
			{ key: constants.TsFlavorName, description: "Learn more at https://nativescript.org/typescript" },
			{ key: constants.JsFlavorName, description: "Use NativeScript without any framework" },
		]);
		return flavorSelection;
	}

	private printInteractiveCreationIntroIfNeeded() {
		if (!this.isInteractionIntroShown) {
			this.isInteractionIntroShown = true;
			this.$logger.info();
			this.$logger.printMarkdown(`# Let’s create a NativeScript app!`);
			this.$logger.printMarkdown(`
Answer the following questions to help us build the right app for you. (Note: you
can skip this prompt next time using the --template option, or the --ng, --react, --vue, --ts, or --js flags.)
`);
		}
	}

	private async interactiveTemplateSelection(flavorSelection: string, adverb: string) {
		const selectedFlavorTemplates: {
			key?: string;
			value: string;
			description?: string;
		}[] = [];
		let selectedTemplate: string;
		switch (flavorSelection) {
			case constants.NgFlavorName: {
				selectedFlavorTemplates.push(...this.getNgTemplates());
				break;
			}
			case constants.ReactFlavorName: {
				selectedFlavorTemplates.push(...this.getReactTemplates());
				break;
			}
			case constants.VueFlavorName: {
				selectedFlavorTemplates.push(...this.getVueTemplates());
				break;
			}
			case constants.TsFlavorName: {
				selectedFlavorTemplates.push(...this.getTsTemplates());
				break;
			}
			case constants.JsFlavorName: {
				selectedFlavorTemplates.push(...this.getJsTemplates());
				break;
			}
		}
		if (selectedFlavorTemplates.length > 1) {
			this.$logger.info();
			const templateChoices = selectedFlavorTemplates.map((template) => {
				return { key: template.key, description: template.description };
			});
			const selectedTemplateKey = await this.$prompter.promptForDetailedChoice(`${adverb}, which template would you like to start from:`, templateChoices);
			selectedTemplate = selectedFlavorTemplates.find(t => t.key === selectedTemplateKey).value;
		} else {
			selectedTemplate = selectedFlavorTemplates[0].value;
		}
		return selectedTemplate;
	}

	private getJsTemplates() {
		const templates = [{
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: constants.RESERVED_TEMPLATE_NAMES.javascript,
			description: CreateProjectCommand.HelloWorldTemplateDescription
		},
		{
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation",
			description: CreateProjectCommand.DrawerTemplateDescription
		},
		{
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation",
			description: CreateProjectCommand.TabsTemplateDescription
		}];

		return templates;
	}

	private getTsTemplates() {
		const templates = [{
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: constants.RESERVED_TEMPLATE_NAMES.typescript,
			description: CreateProjectCommand.HelloWorldTemplateDescription
		},
		{
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation-ts",
			description: CreateProjectCommand.DrawerTemplateDescription
		},
		{
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation-ts",
			description: CreateProjectCommand.TabsTemplateDescription
		}];

		return templates;
	}

	private getNgTemplates() {
		const templates = [{
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: constants.RESERVED_TEMPLATE_NAMES.angular,
			description: CreateProjectCommand.HelloWorldTemplateDescription
		},
		{
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation-ng",
			description: CreateProjectCommand.DrawerTemplateDescription
		},
		{
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation-ng",
			description: CreateProjectCommand.TabsTemplateDescription
		}];

		return templates;
	}

	private getReactTemplates() {
		const templates = [{
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: constants.RESERVED_TEMPLATE_NAMES.react,
			description: CreateProjectCommand.HelloWorldTemplateDescription
		}];

		return templates;
	}

	private getVueTemplates() {
		const templates = [{
			key: CreateProjectCommand.BlankTemplateKey,
			value: "tns-template-blank-vue",
			description: CreateProjectCommand.BlankTemplateDescription
		},
		{
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation-vue",
			description: CreateProjectCommand.DrawerTemplateDescription
		},
		{
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation-vue",
			description: CreateProjectCommand.TabsTemplateDescription
		}];

		return templates;
	}

	public async postCommandAction(args: string[]): Promise<void> {
		const { projectDir } = this.createdProjectData;
		const relativePath = path.relative(process.cwd(), projectDir);
		this.$logger.printMarkdown(`Now you can navigate to your project with \`$ cd ${relativePath}\``);
		this.$logger.printMarkdown(`After that you can preview it on device by executing \`$ ns preview\``);
	}
}

$injector.registerCommand("create", CreateProjectCommand);
