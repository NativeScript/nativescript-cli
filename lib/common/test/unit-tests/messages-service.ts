import { Yok } from "../../yok";
import { format } from "util";
import { join } from "path";
import { MessagesService } from "../../services/messages-service";
import { existsSync } from "fs";
import { assert } from "chai";

function createTestInjector(jsonContents: any, options?: { useRealFsExists: boolean }): IInjector {
	const testInjector = new Yok();
	testInjector.register("fs", {
		exists: (path: string): boolean => options && options.useRealFsExists ? existsSync(path) : true,
		readJson: (filename: string, encoding?: string): any => jsonContents
	});
	testInjector.register("messagesService", MessagesService);

	return testInjector;
}
describe("messages-service", () => {
	let service: IMessagesService;

	describe("pathsToMessageJsonFiles property", () => {
		it("initializes with the default json file", () => {
			const injector = createTestInjector({});
			service = injector.resolve("$messagesService");

			assert.deepEqual(1, service.pathsToMessageJsonFiles.length, "Messages service should initialize with a default json file.");
		});

		it("appends the default json file when setting pathsToMessageJsonFiles", () => {
			const injector = createTestInjector({}, { useRealFsExists: false });
			service = injector.resolve("$messagesService");
			service.pathsToMessageJsonFiles = ["someHackyJsonFile.json"];

			assert.deepEqual(2, service.pathsToMessageJsonFiles.length, "Messages service should append the default json file.");
		});

		it("should throw if non-existent json file is provided", () => {
			const injector = createTestInjector({}, { useRealFsExists: true });
			service = injector.resolve("$messagesService");
			assert.throws(() => { service.pathsToMessageJsonFiles = ["someJsonFile.json"]; }, "someJsonFile.json does not exist");
		});
	});

	describe("getMessage", () => {
		it("returns the given message if not found as key in any json file", () => {
			const injector = createTestInjector({});
			service = injector.resolve("$messagesService");
			const stringMessage = "Some message",
				resultMessage = service.getMessage(stringMessage);
			assert.deepEqual(stringMessage, resultMessage, "Messages service should return the given message if not found as key in any json file in `pathsToMessageJsonFiles` property.");
		});

		it("util.formats the given message if not found as key in any json file and contains special symbol (%s,%d, etc.)", () => {
			const injector = createTestInjector({});
			service = injector.resolve("$messagesService");
			const messageFormat = "Some %s message.",
				formatArg = "formatted",
				expectedMessage = format(messageFormat, formatArg),
				resultMessage = service.getMessage(messageFormat, formatArg);

			assert.deepEqual(expectedMessage, resultMessage, "Messages service should apply util.format.");
		});

		it("should return correct value from json file if found in json message files", () => {
			const jsonContents = { KEY: "Value" },
				injector = createTestInjector(jsonContents);
			service = injector.resolve("$messagesService");

			assert.deepEqual(jsonContents.KEY, service.getMessage("KEY"), "Messages service should return correct value from json file by given key.");
		});

		it("should util.format value from json file if found in json message files and contains special symbol (%s,%d, etc.)", () => {
			const jsonContents = { KEY: "%s value" },
				injector = createTestInjector(jsonContents);
			service = injector.resolve("$messagesService");

			const formatArg = "Formatted",
				expectedMessage = format(jsonContents.KEY, formatArg),
				actualMessage = service.getMessage(jsonContents.KEY, formatArg);

			assert.deepEqual(expectedMessage, actualMessage, "Messages service should util.format value from json file by given key when value is format.");
		});

		it("should return correct value from json file if found in json message files with complex key", () => {
			const jsonContents = {
				KEY: {
					NESTED_KEY: "Value"
				}
			},
				injector = createTestInjector(jsonContents);
			service = injector.resolve("$messagesService");

			assert.deepEqual(jsonContents.KEY.NESTED_KEY, service.getMessage("KEY.NESTED_KEY"), "Messages service should return correct value from json file by given complex key.");
		});

		it("should return correct value from json file if found in client json before common json", () => {
			const commonJsonContents = {
				KEY: "Value"
			},
				clientJsonContents = {
					KEY: "Overriden value"
				},
				pathToDefaultMessageJson = join(__dirname, "..", "..", "resources", "messages", "errorMessages.json"),
				injector = createTestInjector({});

			injector.register("fs", {
				exists: (path: string): boolean => true,
				readJson: (filename: string, encoding?: string): any => filename === pathToDefaultMessageJson ? commonJsonContents : clientJsonContents
			});
			service = injector.resolve("$messagesService");
			service.pathsToMessageJsonFiles = ["clientJsonFile.json"];

			assert.notDeepEqual(commonJsonContents.KEY, service.getMessage("KEY"), "Messages service should return correct value from json file when value is overriden by client.");
			assert.deepEqual(clientJsonContents.KEY, service.getMessage("KEY"), "Messages service should return correct value from json file when value is overriden by client.");
		});
	});
});
