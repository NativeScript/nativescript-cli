import { Yok } from "../../../yok";
import { FilesHashService } from "../../../../services/files-hash-service";
import { FileSystemStub, LoggerStub } from "../../../../../test/stubs";
import { assert } from "chai";
import { IInjector } from "../../../definitions/yok";
import { IStringDictionary } from "../../../declarations";
import * as _ from 'lodash';
import { IFilesHashService } from "../../../../definitions/files-hash-service";

const fileHashes = {
	"file1": "hash1",
	"file2": "hash2",
	"file3": "hash3",
	"file4": "hash4",
	"file5": "hash5",
	"file6": "hash6",
	"file7": "hash7"
};

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("fs", FileSystemStub);
	injector.register("logger", LoggerStub);
	injector.register("filesHashService", FilesHashService);

	return injector;
}

function addFileHashes(hashes: IStringDictionary) {
	const result = {};
	_.extend(result, fileHashes, hashes);
	return result;
}

function removeFileHashes(hashes: IStringDictionary) {
	const result = _.omitBy(fileHashes, (hash: string, filePath: string) => !!_.find(hashes, (newHash: string, newFilePath: string) => newHash === hash && newFilePath === filePath));
	return result;
}

function mockFilesHashService(hashes: IStringDictionary): IFilesHashService {
	const injector = createTestInjector();
	const filesHashService = injector.resolve("filesHashService");
	filesHashService.generateHashes = async () => hashes;

	return filesHashService;
}

describe("filesHashService", () => {
	const testCases = [
		{
			name: "should not return changes when no files are changed",
			newHashes: fileHashes,
			oldHashes: fileHashes,
			expectedChanges: {}
		},
		{
			name: "should return changes when a file is added",
			newHashes: addFileHashes({ "file8": "hash8" }),
			oldHashes: fileHashes,
			expectedChanges: { "file8": "hash8" }
		},
		{
			name: "should return changes when a file is removed",
			newHashes: removeFileHashes({ "file7": "hash7" }),
			oldHashes: fileHashes,
			expectedChanges: { "file7": "hash7" }
		},
		{
			name: "should return changes when a file is added and a file is removed from oldHashes",
			newHashes: addFileHashes({ "file9": "hash9" }),
			oldHashes: removeFileHashes({ "file1": "hash1" }),
			expectedChanges: { "file1": "hash1", "file9": "hash9" }
		},
		{
			name: "should return changes when no oldHashes are provided",
			newHashes: fileHashes,
			oldHashes: {},
			expectedChanges: fileHashes
		},
		{
			name: "should return changes when no newHashes are provided",
			newHashes: {},
			oldHashes: fileHashes,
			expectedChanges: fileHashes
		}
	];

	describe("getChanges", () => {
		_.each(testCases, (testCase: any) => {
			it(`${testCase.name}`, async () => {
				const filesHashService = mockFilesHashService(testCase.newHashes);
				const changes = await filesHashService.getChanges(_.keys(testCase.newHashes), testCase.oldHashes);
				assert.deepEqual(changes, testCase.expectedChanges);
			});
		});
	});

	describe("hasChangesInShasums", () => {
		_.each(testCases, (testCase: any) => {
			it(`${testCase.name}`, () => {
				const filesHashService = mockFilesHashService(testCase.newHashes);
				const hasChanges = filesHashService.hasChangesInShasums(testCase.newHashes, testCase.oldHashes);
				assert.deepEqual(hasChanges, !!_.keys(testCase.expectedChanges).length);
			});
		});
	});
});
