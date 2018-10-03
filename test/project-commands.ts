import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreateProjectCommand } from "../lib/commands/create-project";
import { StringCommandParameter } from "../lib/common/command-params";
import helpers = require("../lib/common/helpers");
import * as constants from "../lib/constants";
import { assert } from "chai";
import { PrompterStub } from "./stubs";

const NgFlavor = "Angular";
const VueFlavor = "Vue.js";
const TsFlavor = "Plain TypeScript";
const JsFlavor = "Plain JavaScript";

let selectedTemplateName: string;
let isProjectCreated: boolean;
let createProjectCalledWithForce: boolean;
let validateProjectCallsCount: number;
const dummyArgs = ["dummyArgsString"];

class ProjectServiceMock implements IProjectService {
	async validateProjectName(opts: { projectName: string, force: boolean, pathToProject: string }): Promise<string> {
		validateProjectCallsCount++;
		return null;
	}

	async createProject(projectOptions: IProjectSettings): Promise<ICreateProjectData> {
		createProjectCalledWithForce = projectOptions.force;
		selectedTemplateName = projectOptions.template;
		isProjectCreated = true;
		return null;
	}

	isValidNativeScriptProject(pathToProject?: string): boolean {
		return true;
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
		template: undefined
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
		projectNameAnswer?: string,
		flavorAnswer?: string,
		templateAnswer?: string,
	}) {
		const prompterStub = <stubs.PrompterStub>testInjector.resolve("$prompter");
		const choices: IDictionary<string> = {};
		if (opts.projectNameAnswer) {
			choices["First, what will be the name of your app?"] = opts.projectNameAnswer;
		}
		if (opts.flavorAnswer) {
			choices[opts.projectNameAnswer ? "Next" : "First" + ", which flavor would you like to use?"] = opts.flavorAnswer;
		}
		if (opts.templateAnswer) {
			choices[opts.projectNameAnswer ? "Finally" : "Next" + ", which template would you like to start from?"] = opts.templateAnswer;
		}

		prompterStub.expect({
			choices
		});
	}

	beforeEach(() => {
		testInjector = createTestInjector();
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

			assert.deepEqual(selectedTemplateName, constants.ANGULAR_NAME);
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should set the template name correctly when used --tsc.", async () => {
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, constants.TYPESCRIPT_NAME);
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
			setupAnswers({ flavorAnswer: NgFlavor, templateAnswer: "Hello World" });

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, "tns-template-hello-world-ng");
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when ts flavor is selected.", async () => {
			setupAnswers({ flavorAnswer: TsFlavor, templateAnswer:  "Hello World" });

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, "tns-template-hello-world-ts");
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should ask for a template when js flavor is selected.", async () => {
			setupAnswers({ flavorAnswer: JsFlavor, templateAnswer:  "Hello World" });

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, "tns-template-hello-world");
			assert.equal(validateProjectCallsCount, 1);
			assert.isTrue(createProjectCalledWithForce);
		});

		it("should select the default vue template when the vue flavor is selected.", async () => {
			setupAnswers({ flavorAnswer: VueFlavor });

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, "https://github.com/NativeScript/template-blank-vue/tarball/0.9.0");
		});
	});
});
