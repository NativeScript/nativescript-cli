import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreateProjectCommand } from "../lib/commands/create-project";
import { StringParameterBuilder } from "../lib/common/command-params";
import * as constants from "../lib/constants";
import { assert } from "chai";

let selectedTemplateName: string;
let isProjectCreated: boolean;
let dummyArgs = ["dummyArgsString"];

class ProjectServiceMock implements IProjectService {
	async createProject(projectName: string, selectedTemplate?: string): Promise<void> {
		selectedTemplateName = selectedTemplate;
		isProjectCreated = true;
	}
}

class ProjectNameValidatorMock implements IProjectNameValidator {
	public validate(name: string): boolean {
		return true;
	}
}

function createTestInjector() {
	let testInjector = new Yok();

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
	testInjector.register("stringParameterBuilder", StringParameterBuilder);

	return testInjector;
}

describe("Project commands tests", () => {
	let testInjector: IInjector;
	let options: IOptions;
	let createProjectCommand: ICommand;

	beforeEach(() => {
		testInjector = createTestInjector();
		isProjectCreated = false;
		selectedTemplateName = undefined;
		options = testInjector.resolve("$options");
		createProjectCommand = testInjector.resolve("$createCommand");
	});

	describe("#CreateProjectCommand", () => {
		it("should not fail when using only --ng.", async () => {
			options.ng = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
		});

		it("should not fail when using only --tsc.", async () => {
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
		});

		it("should not fail when using only --template.", async () => {
			options.template = "ng";

			await createProjectCommand.execute(dummyArgs);

			assert.isTrue(isProjectCreated);
		});

		it("should set the template name correctly when used --ng.", async () => {
			options.ng = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, constants.ANGULAR_NAME);
		});

		it("should set the template name correctly when used --tsc.", async () => {
			options.tsc = true;

			await createProjectCommand.execute(dummyArgs);

			assert.deepEqual(selectedTemplateName, constants.TYPESCRIPT_NAME);
		});

		it("should not set the template name when --ng is not used.", async () => {
			options.ng = false;

			await createProjectCommand.execute(dummyArgs);

			assert.isUndefined(selectedTemplateName);
		});

		it("should not set the template name when --tsc is not used.", async () => {
			options.tsc = false;

			await createProjectCommand.execute(dummyArgs);

			assert.isUndefined(selectedTemplateName);
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
	});
});
