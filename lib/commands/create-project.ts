import * as constants from "../constants";
import * as path from "path";
import { isInteractive } from "../common/helpers";

export class CreateProjectCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];
	private static NgFlavor = "Angular";
	private static VueFlavor = "Vue.js";
	private static TsFlavor = "Plain TypeScript";
	private static JsFlavor = "Plain JavaScript";
	private static HelloWorldTemplateKey = "Hello World";
	private static HelloWorldTemplateDescription = "A Hello World app";
	private static DrawerTemplateKey = "SideDrawer";
	private static DrawerTemplateDescription = "An app with pre-built pages that uses a drawer for navigation";
	private static TabsTemplateKey = "Tabs";
	private static TabsTemplateDescription = "An app with pre-built pages that uses tabs for navigation";

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
			this.$errors.fail("You cannot use a flavor option like --ng, --vue, --tsc and --js together with --template.");
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
		} else {
			selectedTemplate = this.$options.template;
		}

		if ((!selectedTemplate || !projectName) && isInteractive()) {
			this.printInteractiveCreationIntro();
		}

		if (!projectName && isInteractive()) {
			projectName = await this.$prompter.getString(`${getNextInteractiveAdverb()}, what will be the name of your app?`, { allowEmpty: false });
			this.$logger.info();
		}

		projectName = await this.$projectService.validateProjectName({ projectName: projectName, force: this.$options.force, pathToProject: this.$options.path });

		if (!selectedTemplate && isInteractive()) {
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
		const flavorSelection = await this.$prompter.promptForDetailedChoice(`${adverb}, which flavor would you like to use?`, [
			{ key: CreateProjectCommand.NgFlavor, description: "Learn more at https://angular.io/" },
			{ key: CreateProjectCommand.VueFlavor, description: "Learn more at https://vuejs.org/" },
			{ key: CreateProjectCommand.TsFlavor, description: "Learn more at https://www.typescriptlang.org/" },
			{ key: CreateProjectCommand.JsFlavor, description: "Learn more at https://www.javascript.com/" },
		]);
		return flavorSelection;
	}

	private printInteractiveCreationIntro() {
		this.$logger.info();
		this.$logger.printMarkdown(`# Let’s create a NativeScript app!`);
		this.$logger.printMarkdown(`
Answer the following questions to help us build the right app for you. (Note: you
can skip this prompt next time using the --template option, or the --ng, --vue, --ts,
or --js flags.)
`);
	}

	private async interactiveTemplateSelection(flavorSelection: string, adverb: string) {
		const selectedFlavorTemplates: {
			key?: string;
			value: string;
			description?: string;
		}[] = [];
		let selectedTemplate: string;
		switch (flavorSelection) {
			case CreateProjectCommand.NgFlavor: {
				selectedFlavorTemplates.push(...this.getNgFlavors());
				break;
			}
			case CreateProjectCommand.VueFlavor: {
				selectedFlavorTemplates.push({ value: "https://github.com/NativeScript/template-blank-vue/tarball/0.9.0" });
				break;
			}
			case CreateProjectCommand.TsFlavor: {
				selectedFlavorTemplates.push(...this.getTsTemplates());
				break;
			}
			case CreateProjectCommand.JsFlavor: {
				selectedFlavorTemplates.push(...this.getJsTemplates());
				break;
			}
		}
		if (selectedFlavorTemplates.length > 1) {
			this.$logger.info();
			const templateChoices = selectedFlavorTemplates.map((template) => {
				return { key: template.key, description: template.description };
			});
			const selectedTemplateKey = await this.$prompter.promptForDetailedChoice(`${adverb}, which template would you like to start from?`, templateChoices);
			selectedTemplate = selectedFlavorTemplates.find(t => t.key === selectedTemplateKey).value;
		} else {
			selectedTemplate = selectedFlavorTemplates[0].value;
		}
		return selectedTemplate;
	}

	private getJsTemplates() {
		const templates: {
			key?: string;
			value: string;
			description?: string;
		}[] = [];
		templates.push({
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: "tns-template-hello-world",
			description: CreateProjectCommand.HelloWorldTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation",
			description: CreateProjectCommand.DrawerTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation",
			description: CreateProjectCommand.TabsTemplateDescription
		});
		return templates;
	}

	private getTsTemplates() {
		const templates: {
			key?: string;
			value: string;
			description?: string;
		}[] = [];
		templates.push({
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: "tns-template-hello-world-ts",
			description: CreateProjectCommand.HelloWorldTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation-ts",
			description: CreateProjectCommand.DrawerTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation-ts",
			description: CreateProjectCommand.TabsTemplateDescription
		});
		return templates;
	}

	private getNgFlavors() {
		const templates: {
			key?: string;
			value: string;
			description?: string;
		}[] = [];
		templates.push({
			key: CreateProjectCommand.HelloWorldTemplateKey,
			value: "tns-template-hello-world-ng",
			description: CreateProjectCommand.HelloWorldTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.DrawerTemplateKey,
			value: "tns-template-drawer-navigation-ng",
			description: CreateProjectCommand.DrawerTemplateDescription
		});
		templates.push({
			key: CreateProjectCommand.TabsTemplateKey,
			value: "tns-template-tab-navigation-ng",
			description: CreateProjectCommand.TabsTemplateDescription
		});

		return templates;
	}

	public async postCommandAction(args: string[]): Promise<void> {
		const { projectDir } = this.createdProjectData;
		const relativePath = path.relative(process.cwd(), projectDir);
		this.$logger.printMarkdown(`Now you can navigate to your project with \`$ cd ${relativePath}\``);
		this.$logger.printMarkdown(`After that you can run it on device/emulator by executing \`$ tns run <platform>\``);
	}
}

$injector.registerCommand("create", CreateProjectCommand);
