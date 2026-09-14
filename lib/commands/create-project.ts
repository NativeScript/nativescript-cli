import * as path from "path";
import { color } from "../color";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { isInteractive } from "../common/helpers";
import * as constants from "../constants";
import { ICreateProjectData, IProjectService } from "../definitions/project";

const BLANK_TEMPLATE_KEY = "Blank";
const BLANK_TEMPLATE_DESCRIPTION = "A blank app";
const BLANK_TS_TEMPLATE_KEY = "Blank Typescript";
const BLANK_TS_TEMPLATE_DESCRIPTION = "A blank typescript app";
const BLANK_VISION_TEMPLATE_KEY = "visionOS";
const BLANK_VISION_TEMPLATE_DESCRIPTION = "A visionOS app";
const HELLO_WORLD_TEMPLATE_KEY = "Hello World";
const HELLO_WORLD_TEMPLATE_DESCRIPTION = "A Hello World app";
const DRAWER_TEMPLATE_KEY = "SideDrawer";
const DRAWER_TEMPLATE_DESCRIPTION =
	"An app with pre-built pages that uses a drawer for navigation";
const TABS_TEMPLATE_KEY = "Tabs";
const TABS_TEMPLATE_DESCRIPTION =
	"An app with pre-built pages that uses tabs for navigation";

export const createProjectCommandOptions = {
	js: booleanOption(),
	ng: booleanOption(),
	react: booleanOption(),
	solid: booleanOption(),
	svelte: booleanOption(),
	tsc: booleanOption(),
	vue: booleanOption(),
	vuejs: booleanOption(),
	vision: booleanOption(),
	"vision-ng": booleanOption(),
	"vision-react": booleanOption(),
	"vision-solid": booleanOption(),
	"vision-svelte": booleanOption(),
	"vision-vue": booleanOption(),
	template: stringOption(),
	appid: stringOption(),
	path: stringOption(),
	force: booleanOption(),
	ignoreScripts: booleanOption(),
} satisfies CommandOptionsSchema;

export type CreateProjectCommandContext = CommandContext<
	typeof createProjectCommandOptions
>;

export function setupCreateProjectCommand() {
	return {
		$projectService: inject<IProjectService>("projectService"),
		$logger: inject<ILogger>("logger"),
		$prompter: inject<IPrompter>("prompter"),
	};
}

export type ICreateProjectCommandServices = ReturnType<
	typeof setupCreateProjectCommand
>;

interface ITemplateChoice {
	key?: string;
	value: string;
	description?: string;
}

function getJsTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.javascript,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: DRAWER_TEMPLATE_KEY,
			value: "@nativescript/template-drawer-navigation",
			description: DRAWER_TEMPLATE_DESCRIPTION,
		},
		{
			key: TABS_TEMPLATE_KEY,
			value: "@nativescript/template-tab-navigation",
			description: TABS_TEMPLATE_DESCRIPTION,
		},
	];
}

function getTsTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.typescript,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: DRAWER_TEMPLATE_KEY,
			value: "@nativescript/template-drawer-navigation-ts",
			description: DRAWER_TEMPLATE_DESCRIPTION,
		},
		{
			key: TABS_TEMPLATE_KEY,
			value: "@nativescript/template-tab-navigation-ts",
			description: TABS_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-hello-world-ts-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

function getNgTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.angular,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: DRAWER_TEMPLATE_KEY,
			value: "@nativescript/template-drawer-navigation-ng",
			description: DRAWER_TEMPLATE_DESCRIPTION,
		},
		{
			key: TABS_TEMPLATE_KEY,
			value: "@nativescript/template-tab-navigation-ng",
			description: TABS_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-hello-world-ng-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

function getReactTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.react,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-blank-react-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

function getSolidTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.solid,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: `${HELLO_WORLD_TEMPLATE_KEY} using TypeScript`,
			value: constants.RESERVED_TEMPLATE_NAMES.solidts,
			description: `${HELLO_WORLD_TEMPLATE_DESCRIPTION} using TypeScript`,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-blank-solid-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

function getSvelteTemplates(): ITemplateChoice[] {
	return [
		{
			key: HELLO_WORLD_TEMPLATE_KEY,
			value: constants.RESERVED_TEMPLATE_NAMES.svelte,
			description: HELLO_WORLD_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-blank-svelte-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

function getVueTemplates(): ITemplateChoice[] {
	return [
		{
			key: BLANK_TEMPLATE_KEY,
			value: "@nativescript/template-blank-vue",
			description: BLANK_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_TS_TEMPLATE_KEY,
			value: "@nativescript/template-blank-vue-ts",
			description: BLANK_TS_TEMPLATE_DESCRIPTION,
		},
		{
			key: DRAWER_TEMPLATE_KEY,
			value: "@nativescript/template-drawer-navigation-vue",
			description: DRAWER_TEMPLATE_DESCRIPTION,
		},
		{
			key: TABS_TEMPLATE_KEY,
			value: "@nativescript/template-tab-navigation-vue",
			description: TABS_TEMPLATE_DESCRIPTION,
		},
		{
			key: BLANK_VISION_TEMPLATE_KEY,
			value: "@nativescript/template-blank-vue-vision",
			description: BLANK_VISION_TEMPLATE_DESCRIPTION,
		},
	];
}

const flavorTemplates: { [flavorName: string]: () => ITemplateChoice[] } = {
	[constants.NgFlavorName]: getNgTemplates,
	[constants.ReactFlavorName]: getReactTemplates,
	[constants.VueFlavorName]: getVueTemplates,
	[constants.SolidFlavorName]: getSolidTemplates,
	[constants.SvelteFlavorName]: getSvelteTemplates,
	[constants.TsFlavorName]: getTsTemplates,
	[constants.JsFlavorName]: getJsTemplates,
};

/** The template a flavor flag selects, without asking anything. */
function selectTemplateFromOptions(
	options: CreateProjectCommandContext["options"],
): string {
	if (options["vision-ng"] || (options.vision && options.ng)) {
		return constants.RESERVED_TEMPLATE_NAMES["vision-ng"];
	}

	if (options["vision-react"] || (options.vision && options.react)) {
		return constants.RESERVED_TEMPLATE_NAMES["vision-react"];
	}

	if (options["vision-solid"] || (options.vision && options.solid)) {
		return constants.RESERVED_TEMPLATE_NAMES["vision-solid"];
	}

	if (options["vision-svelte"] || (options.vision && options.svelte)) {
		return constants.RESERVED_TEMPLATE_NAMES["vision-svelte"];
	}

	if (
		options["vision-vue"] ||
		(options.vision && (options.vue || options.vuejs))
	) {
		return constants.RESERVED_TEMPLATE_NAMES["vision-vue"];
	}

	if ((options.vue || options.vuejs) && options.tsc) {
		return "@nativescript/template-blank-vue-ts";
	}

	if (options.vision) {
		return constants.RESERVED_TEMPLATE_NAMES["vision"];
	}

	if (options.js) {
		return constants.JAVASCRIPT_NAME;
	}

	if (options.tsc) {
		return constants.TYPESCRIPT_NAME;
	}

	if (options.ng) {
		return constants.ANGULAR_NAME;
	}

	if (options.vue || options.vuejs) {
		return constants.VUE_NAME;
	}

	if (options.solid) {
		return constants.SOLID_NAME;
	}

	if (options.react) {
		return constants.REACT_NAME;
	}

	if (options.svelte) {
		return constants.SVELTE_NAME;
	}

	return options.template;
}

function interactiveFlavorSelection(
	services: ICreateProjectCommandServices,
	adverb: string,
): Promise<string> {
	return services.$prompter.promptForDetailedChoice(
		`${adverb}, which style of NativeScript project would you like to use:`,
		[
			{
				key: constants.NgFlavorName,
				description: "Learn more at https://nativescript.org/angular",
			},
			{
				key: constants.ReactFlavorName,
				description:
					"Learn more at https://github.com/shirakaba/react-nativescript",
			},
			{
				key: constants.VueFlavorName,
				description: "Learn more at https://nativescript.org/vue",
			},
			{
				key: constants.SolidFlavorName,
				description: "Learn more at https://www.solidjs.com",
			},
			{
				key: constants.SvelteFlavorName,
				description: "Learn more at https://svelte-native.technology",
			},
			{
				key: constants.TsFlavorName,
				description: "Learn more at https://nativescript.org/typescript",
			},
			{
				key: constants.JsFlavorName,
				description: "Use NativeScript without any framework",
			},
		],
	);
}

async function interactiveTemplateSelection(
	services: ICreateProjectCommandServices,
	flavorSelection: string,
	adverb: string,
): Promise<string> {
	const getTemplates = flavorTemplates[flavorSelection];
	const selectedFlavorTemplates: ITemplateChoice[] = getTemplates
		? getTemplates()
		: [];

	if (selectedFlavorTemplates.length > 1) {
		services.$logger.info();
		const templateChoices = selectedFlavorTemplates.map((template) => {
			return { key: template.key, description: template.description };
		});
		const selectedTemplateKey =
			await services.$prompter.promptForDetailedChoice(
				`${adverb}, which template would you like to start from:`,
				templateChoices,
			);

		return selectedFlavorTemplates.find((t) => t.key === selectedTemplateKey)
			.value;
	}

	return selectedFlavorTemplates[0].value;
}

async function interactiveFlavorAndTemplateSelection(
	services: ICreateProjectCommandServices,
	flavorAdverb: string,
	templateAdverb: string,
): Promise<string> {
	const selectedFlavor = await interactiveFlavorSelection(
		services,
		flavorAdverb,
	);

	return interactiveTemplateSelection(services, selectedFlavor, templateAdverb);
}

export async function runCreateProjectCommand(
	context: CreateProjectCommandContext,
	services: ICreateProjectCommandServices,
): Promise<ICreateProjectData> {
	const options = context.options;
	const interactiveAdverbs = ["First", "Next", "Finally"];
	const getNextInteractiveAdverb = () => {
		return interactiveAdverbs.shift() || "Next";
	};

	let isInteractionIntroShown = false;
	const printInteractiveCreationIntroIfNeeded = () => {
		if (isInteractionIntroShown) {
			return;
		}

		isInteractionIntroShown = true;
		services.$logger.info();
		services.$logger.printMarkdown(`# Let’s create a NativeScript app!`);
		services.$logger.printMarkdown(`
Answer the following questions to help us build the right app for you. (Note: you
can skip this prompt next time using the --template option, or using --ng, --react, --solid, --svelte, --vue, --ts, or --js flags.)
`);
	};

	if (
		(options.tsc ||
			options.ng ||
			options.vue ||
			options.react ||
			options.solid ||
			options.svelte ||
			options.js) &&
		options.template
	) {
		context.fail(
			"You cannot use a flavor option like --ng, --vue, --react, --solid, --svelte, --tsc and --js together with --template.",
		);
	}

	let projectName = context.args[0];
	let selectedTemplate = selectTemplateFromOptions(options);

	if (!projectName && isInteractive()) {
		printInteractiveCreationIntroIfNeeded();
		projectName = await services.$prompter.getString(
			`${getNextInteractiveAdverb()}, what will be the name of your app?`,
			{ allowEmpty: false },
		);
		services.$logger.info();
	}

	projectName = await services.$projectService.validateProjectName({
		projectName: projectName,
		force: options.force,
		pathToProject: options.path,
	});

	if (!selectedTemplate && isInteractive()) {
		printInteractiveCreationIntroIfNeeded();
		selectedTemplate = await interactiveFlavorAndTemplateSelection(
			services,
			getNextInteractiveAdverb(),
			getNextInteractiveAdverb(),
		);
	}

	return services.$projectService.createProject({
		projectName: projectName,
		template: selectedTemplate,
		appId: options.appid,
		pathToProject: options.path,
		// its already validated above
		force: true,
		ignoreScripts: options.ignoreScripts,
	});
}

export function reportCreatedProject(
	context: CreateProjectCommandContext,
	createdProjectData: ICreateProjectData,
	services: ICreateProjectCommandServices,
): void {
	const { projectDir, projectName } = createdProjectData;
	const relativePath = path.relative(process.cwd(), projectDir);

	const greyDollarSign = color.grey("$");
	services.$logger.clearScreen();
	let runDebugNotes: Array<string> = [];
	if (
		context.options.vision ||
		context.options["vision-ng"] ||
		context.options["vision-react"] ||
		context.options["vision-solid"] ||
		context.options["vision-svelte"] ||
		context.options["vision-vue"]
	) {
		runDebugNotes = [
			`Run the project on Vision Pro with:`,
			"",
			`  ${greyDollarSign} ${color.green("ns run visionos --no-hmr")}`,
		];
	} else {
		runDebugNotes = [
			`Run the project on multiple devices:`,
			"",
			`  ${greyDollarSign} ${color.green("ns run ios")}`,
			`  ${greyDollarSign} ${color.green("ns run android")}`,
			"",
			"Debug the project with Chrome DevTools:",
			"",
			`  ${greyDollarSign} ${color.green("ns debug ios")}`,
			`  ${greyDollarSign} ${color.green("ns debug android")}`,
		];
	}
	services.$logger.info(
		[
			[
				color.green(`Project`),
				color.cyan(projectName),
				color.green(`was successfully created.`),
			].join(" "),
			"",
			`Now you can navigate to your project with ${color.cyan(
				`cd ${relativePath}`,
			)} and then:`,
			"",
			...runDebugNotes,
			``,
			`For more options consult the docs or run ${color.green("ns --help")}`,
			"",
		].join("\n"),
	);
	// todo: add back ns preview
	// this.$logger.printMarkdown(
	// 	`After that you can preview it on device by executing \`$ ns preview\``
	// );
}

export const createProjectCommandDefinition = defineCommand({
	name: "create",
	description: "Creates a new NativeScript project.",
	options: createProjectCommandOptions,
	arguments: [{ name: "projectName" }],
	enableHooks: false,
	setup: setupCreateProjectCommand,
	run: runCreateProjectCommand,
	postRun: reportCreatedProject,
});
