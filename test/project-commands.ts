import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreateProjectCommand } from "../lib/commands/create-project";
import { StringCommandParameter } from "../lib/common/command-params";
import * as helpers from "../lib/common/helpers";
import * as constants from "../lib/constants";
import { assert } from "chai";
import { PrompterStub } from "./stubs";
import {
	IProjectService,
	IProjectSettings,
	ICreateProjectData,
} from "../lib/definitions/project";
import { IOptions } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { ICommand } from "../lib/common/definitions/commands";
import { IDictionary } from "../lib/common/declarations";

let selectedTemplateName: string;
let isProjectCreated: boolean;
let createProjectCalledWithForce: boolean;
let validateProjectCallsCount: number;
const dummyArgs = ["dummyArgsString"];
const expectedFlavorChoices = [
	{
		key: "Angular",
		description: "Learn more at https://nativescript.org/angular",
	},
	{
		key: "React",
		description:
			"Learn more at https://github.com/shirakaba/react-nativescript",
	},
	{ key: "Vue.js", description: "Learn more at https://nativescript.org/vue" },
	{
		key: "Svelte",
		description: "Learn more at https://svelte-native.technology",
	},
	{
		key: "Plain TypeScript",
		description: "Learn more at https://nativescript.org/typescript",
	},
	{
		key: "Plain JavaScript",
		description: "Use NativeScript without any framework",
	},
];
const templateChoices = {
	helloWorld: { key: "Hello World", description: "A Hello World app" },
	blank: { key: "Blank", description: "A blank app" },
	blankTypeScript: {
		key: "Blank Typescript",
		description: "A blank typescript app",
	},
	sideDrawer: {
		key: "SideDrawer",
		description:
			"An app with pre-built pages that uses a drawer for navigation",
	},
	tabs: {
		key: "Tabs",
		description: "An app with pre-built pages that uses tabs for navigation",
	},
};
const expectedTemplateChoices = [
	templateChoices.helloWorld,
	templateChoices.sideDrawer,
	templateChoices.tabs,
];
const expectedTemplateChoicesVue = [
	templateChoices.blank,
	templateChoices.blankTypeScript,
	templateChoices.sideDrawer,
	templateChoices.tabs,
];

class ProjectServiceMock implements IProjectService {
	async validateProjectName(opts: {
		projectName: string;
		force: boolean;
		pathToProject: string;
	}): Promise<string> {
		validateProjectCallsCount++;
		return null;
	}

	async createProject(
		projectOptions: IProjectSettings
	): Promise<ICreateProjectData> {
		createProjectCalledWithForce = projectOptions.force;
		selectedTemplateName = projectOptions.template;
		isProjectCreated = true;
		return null;
	}

	isValidNativeScriptProject(pathToProject?: string): boolean {
		return true;
	}

	ensureAppResourcesExist(projectDir: string): Promise<void> {
		return;
	}
}

class ProjectNameValidatorMock implements IProjectNameValidator {
	public validate(name: string): boolean {
		return true;
	}
}

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("injector", testInjector);
	testInjector.register("staticConfig", {});
	testInjector.register("projectService", ProjectServiceMock);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("projectNameValidator", ProjectNameValidatorMock);
	testInjector.register("options", {
		ng: false,
		template: undefined,
	});
	testInjector.register("createCommand", CreateProjectCommand);
	testInjector.register("stringParameter", StringCommandParameter);
	testInjector.register("prompter", PrompterStub);

	return testInjector;
}

describe("Project commands tests", () => {
	let testInjector: IInjector;
	let options: IOptions;
	let createProjectCommand: ICommand;

	function setupAnswers(opts: {
		projectNameAnswer?: string;
		flavorAnswer?: string;
		templateAnswer?: string;
	}) {
		const prompterStub = <stubs.PrompterStub>testInjector.resolve("$prompter");
		const answers: IDictionary<string> = {};
		const questionChoices: IDictionary<any[]> = {};
		if (opts.projectNameAnswer) {
			answers["First, what will be the name of your app?"] =
				opts.projectNameAnswer;
		}
		if (opts.flavorAnswer) {
			const flavorQuestion = opts.projectNameAnswer
				? "Next"
				: "First, which style of NativeScript project would you like to use:";
			answers[flavorQuestion] = opts.flavorAnswer;
			questionChoices[flavorQuestion] = expectedFlavorChoices;
		}
		if (opts.templateAnswer) {
			const templateQuestion = opts.projectNameAnswer
				? "Finally"
				: "Next, which template would you like to start from:";
			answers[templateQuestion] = opts.templateAnswer;
			questionChoices[templateQuestion] =
				opts.flavorAnswer === constants.VueFlavorName
					? expectedTemplateChoicesVue
					: expectedTemplateChoices;
		}

		prompterStub.expect({
			answers,
			questionChoices,
		});
	}

	beforeEach(() => {
		testInjector = createTestInjector();
		// @ts-expect-error
		helpers.isInteractive = () => true;
		isProjectCreated = false;
		validateProjectCallsCount = 0;
		createProjectCalledWithForce = false;
		selectedTemplateName = undefined;
		options = testInjector.resolve("$options");
		createProjectCommand = testInjector.resolve("$createCommand");
	});

	describe("#CreateProjectCommand", () => {
		it("should not fail when using only --ng.", async () => {
			options.ng = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using only --react.", async () => {
			options.react = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using only --svelte.", async () => {
			options.svelte = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using only --vue.", async () => {
			options.vue = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using --vue and --tsc.", async () => {
			options.vue = true;
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using only --tsc.", async () => {
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should not fail when using only --template.", async () => {
			options.template = "ng";

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should set the template name correctly when used --ng.", async () => {
			options.ng = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(selectedTemplateName, constants.ANGULAR_NAME);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should set the template name correctly when used --react.", async () => {
			options.react = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(selectedTemplateName, constants.REACT_NAME);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should set the template name correctly when used --svelte.", async () => {
			options.svelte = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(selectedTemplateName, constants.SVELTE_NAME);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should set the template name correctly when used --tsc.", async () => {
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(selectedTemplateName, constants.TYPESCRIPT_NAME);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should fail when --ng and --template are used simultaneously.", async () => {
			options.ng = true;
			options.template = "ng";

			await assert.isRejected(createProjectCommand.execute(dummyArgs));
		});

		it("should fail when --tsc and --template are used simultaneously.", async () => {
			options.tsc = true;
			options.template = "tsc";

			await assert.isRejected(createProjectCommand.execute(dummyArgs));
		});

		it("should ask for a template when ng flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.NgFlavorName,
				templateAnswer: "Hello World",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-hello-world-ng"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when ts flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.TsFlavorName,
				templateAnswer: "SideDrawer",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-drawer-navigation-ts"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when js flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.JsFlavorName,
				templateAnswer: "Tabs",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-tab-navigation"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when vue flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.VueFlavorName,
				templateAnswer: "SideDrawer",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-drawer-navigation-vue"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when react flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.ReactFlavorName,
				templateAnswer: "Hello World",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-blank-react"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when svelte flavor is selected.", async () => {
			setupAnswers({
				flavorAnswer: constants.SvelteFlavorName,
				templateAnswer: "Hello World",
			});

			await createProjectCommand.execute(dummyArgs);

			assert.deepStrictEqual(
				selectedTemplateName,
				"@nativescript/template-blank-svelte"
			);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});
	});
});
