import { Yok } from "../src/common/yok";
import { ProjectNameService } from "../src/services/project-name-service";
import { assert } from "chai";
import { ErrorsStub, LoggerStub } from "./stubs";

const mockProjectNameValidator = {
	validate: () => true
};

const dummyString: string = "dummyString";

function createTestInjector(): IInjector {
	let testInjector: IInjector;

	testInjector = new Yok();
	testInjector.register("projectNameService", ProjectNameService);
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("logger", LoggerStub);
	testInjector.register("prompter", {
		confirm: (message: string): Promise<boolean> => Promise.resolve(true),
		getString: (message: string): Promise<string> => Promise.resolve(dummyString)
	});

	return testInjector;
}

describe("Project Name Service Tests", () => {
	let testInjector: IInjector;
	let projectNameService: IProjectNameService;
	const validProjectName = "valid";
	const invalidProjectNames = ["1invalid", "app"];

	beforeEach(() => {
		testInjector = createTestInjector();
		projectNameService = testInjector.resolve("projectNameService");
	});

	it("returns correct name when valid name is entered", async () => {
		const actualProjectName = await projectNameService.ensureValidName(validProjectName);

		assert.deepEqual(actualProjectName, validProjectName);
	});

	_.each(invalidProjectNames, invalidProjectName => {
		it(`returns correct name when "${invalidProjectName}" is entered several times and then valid name is entered`, async () => {
			const prompter = testInjector.resolve("prompter");
			prompter.confirm = (message: string): Promise<boolean> => Promise.resolve(false);

			const incorrectInputsLimit = 5;
			let incorrectInputsCount = 0;

			prompter.getString = async (message: string): Promise<string> => {
				if (incorrectInputsCount < incorrectInputsLimit) {
					incorrectInputsCount++;

					return invalidProjectName;
				} else {
					return validProjectName;
				}
			};

			const actualProjectName = await projectNameService.ensureValidName(invalidProjectName);

			assert.deepEqual(actualProjectName, validProjectName);
		});

		it(`returns the invalid name when "${invalidProjectName}" is entered and --force flag is present`, async () => {
			const actualProjectName = await projectNameService.ensureValidName(validProjectName, { force: true });

			assert.deepEqual(actualProjectName, validProjectName);
		});
	});
});
