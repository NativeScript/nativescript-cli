/// <reference path=".d.ts" />
"use strict";

import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import { CreateProjectCommand } from "../lib/commands/create-project";
import * as constants from "../lib/constants";
import {assert} from "chai";

let selectedTemplateName: string;
let isProjectCreated: boolean;
let dummyArgsString = "dummyArgsString";

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
	let testInjector = new yok.Yok();

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

	return testInjector;
}

describe('Project Service Tests', () => {
	let testInjector: IInjector;

	beforeEach(() => {
		testInjector = createTestInjector();
		isProjectCreated = false;
	});

	describe("project commands tests", () => {
		describe("#CreateProjectCommand", () => {
			it("should not fail when using only --ng.", () => {
				let options: IOptions = testInjector.resolve("$options");
				options.ng = true;

				let createProjectCommand: ICommand = testInjector.resolve("$createCommand");

				createProjectCommand.execute([dummyArgsString]).wait();

				assert.isTrue(isProjectCreated);
			});

			it("should not fail when using only --template.", () => {
				let options: IOptions = testInjector.resolve("$options");
				options.template = "ng";

				let createProjectCommand: ICommand = testInjector.resolve("$createCommand");

				createProjectCommand.execute([dummyArgsString]).wait();

				assert.isTrue(isProjectCreated);
			});

			it("should set the template name correctly when used --ng.", () => {
				let options: IOptions = testInjector.resolve("$options");
				options.ng = true;

				let createProjectCommand: ICommand = testInjector.resolve("$createCommand");

				createProjectCommand.execute([dummyArgsString]).wait();

				assert.deepEqual(options.template, constants.ANGULAR_NAME);
			});

			it("should not set the template name when --ng is not used.", () => {
				let options: IOptions = testInjector.resolve("$options");
				options.ng = false;

				let createProjectCommand: ICommand = testInjector.resolve("$createCommand");

				createProjectCommand.execute([dummyArgsString]).wait();

				assert.isUndefined(options.template);
			});

			it("should fail when --ng and --template are used simultaneously.", () => {
				let options: IOptions = testInjector.resolve("$options");
				options.ng = true;
				options.template = "ng";

				let createProjectCommand: ICommand = testInjector.resolve("$createCommand");

				assert.throws(() => {
					createProjectCommand.execute([dummyArgsString]).wait();
				});
			});
		});
	});
});
