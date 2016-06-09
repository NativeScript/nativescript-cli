import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreateProjectCommand } from "../lib/commands/create-project";
import { StringParameterBuilder } from "../lib/common/command-params";
import * as constants from "../lib/constants";
import {assert} from "chai";

let selectedTemplateName: string;
let isProjectCreated: boolean;
let dummyArgs = ["dummyArgsString"];

class ProjectServiceMock implements IProjectService {
	createProject(projectName: string, selectedTemplate?: string): IFuture<void> {
		return (() => {
			selectedTemplateName = selectedTemplate;
			isProjectCreated = true;
		}).future<void>()();
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
		it("should not fail when using only --ng.", () => {
			options.ng = true;

			createProjectCommand.execute(dummyArgs).wait();

			assert.isTrue(isProjectCreated);
		});

		it("should not fail when using only --template.", () => {
			options.template = "ng";

			createProjectCommand.execute(dummyArgs).wait();

			assert.isTrue(isProjectCreated);
		});

		it("should set the template name correctly when used --ng.", () => {
			options.ng = true;

			createProjectCommand.execute(dummyArgs).wait();

			assert.deepEqual(selectedTemplateName, constants.ANGULAR_NAME);
		});

		it("should not set the template name when --ng is not used.", () => {
			options.ng = false;

			createProjectCommand.execute(dummyArgs).wait();

			assert.isUndefined(selectedTemplateName);
		});

		it("should fail when --ng and --template are used simultaneously.", () => {
			options.ng = true;
			options.template = "ng";

			assert.throws(() => {
				createProjectCommand.execute(dummyArgs).wait();
			});
		});
	});
});
