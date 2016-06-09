import {Yok} from "../lib/common/yok";
import {ProjectNameService} from "../lib/services/project-name-service";
import {assert} from "chai";
import {ErrorsStub, LoggerStub} from "./stubs";
import Future = require("fibers/future");

let mockProjectNameValidator = {
	validate: () => true
};

let dummyString: string = "dummyString";

function createTestInjector(): IInjector {
	let testInjector: IInjector;

	testInjector = new Yok();
	testInjector.register("projectNameService", ProjectNameService);
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("logger", LoggerStub);
	testInjector.register("prompter", {
		confirm: (message: string): IFuture<boolean> => Future.fromResult(true),
		getString: (message: string): IFuture<string> => Future.fromResult(dummyString)
	});

	return testInjector;
}

describe("Project Name Service Tests", () => {
	let testInjector: IInjector;
	let projectNameService: IProjectNameService;
	let validProjectName = "valid";
	let invalidProjectNames = ["1invalid", "app"];

	beforeEach(() => {
		testInjector = createTestInjector();
		projectNameService = testInjector.resolve("projectNameService");
	});

	it("returns correct name when valid name is entered", () => {
		let actualProjectName = projectNameService.ensureValidName(validProjectName).wait();

		assert.deepEqual(actualProjectName, validProjectName);
	});

	_.each(invalidProjectNames, invalidProjectName => {
		it(`returns correct name when "${invalidProjectName}" is entered several times and then valid name is entered`, () => {
			let prompter = testInjector.resolve("prompter");
			prompter.confirm = (message: string): IFuture<boolean> => Future.fromResult(false);

			let incorrectInputsLimit = 5;
			let incorrectInputsCount = 0;

			prompter.getString = (message: string): IFuture<string> => {
				return (() => {
					if (incorrectInputsCount < incorrectInputsLimit) {
						incorrectInputsCount++;

						return invalidProjectName;
					} else {
						return validProjectName;
					}
				}).future<string>()();
			};

			let actualProjectName = projectNameService.ensureValidName(invalidProjectName).wait();

			assert.deepEqual(actualProjectName, validProjectName);
		});

		it(`returns the invalid name when "${invalidProjectName}" is entered and --force flag is present`, () => {
			let actualProjectName = projectNameService.ensureValidName(validProjectName, { force: true }).wait();

			assert.deepEqual(actualProjectName, validProjectName);
		});
	});
});
