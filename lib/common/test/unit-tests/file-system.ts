import { Yok } from "../../yok";
import * as path from "path";
import temp = require("temp");
import * as hostInfoLib from "../../host-info";
import { assert, use } from "chai";
import * as fileSystemFile from "../../file-system";
import * as childProcessLib from "../../child-process";
import { CommonLoggerStub } from "./stubs";

use(require("chai-as-promised"));

const sampleZipFileTest = path.join(__dirname, "../resources/sampleZipFileTest.zip");
const unzippedFileName = "sampleZipFileTest.txt";
const sampleZipFileTestIncorrectName = path.join(__dirname, "../resources/sampleZipfileTest.zip");

function isOsCaseSensitive(testInjector: IInjector): boolean {
	const hostInfo = testInjector.resolve("hostInfo");
	return hostInfo.isLinux;
}
temp.track();

function createWriteJsonTestCases(): { exists: boolean, text: string, testCondition: string, expectedIndentation: string }[] {
	return [
		{
			exists: true,
			text: `{\n\t"a" : 5 }`,
			testCondition: "when the indentation is tab",
			expectedIndentation: "\t"
		}, {
			exists: true,
			text: `{\n "a" : 5 }`,
			testCondition: "when the indentation is space",
			expectedIndentation: " "
		}, {
			exists: true,
			text: `{\n  "a" : 5 }`,
			testCondition: "when the indentation is two spaces",
			expectedIndentation: "  "
		}, {
			exists: false,
			text: `{\n "a" : 5 }`,
			testCondition: "when the file does not exist",
			expectedIndentation: "\t"
		}, {
			exists: true,
			text: `"just-string"`,
			testCondition: "when the the content is string",
			expectedIndentation: "\t"
		}, {
			exists: true,
			text: `{ "a" : 5 }`,
			testCondition: "when the content does not have new line after the {",
			expectedIndentation: " "
		}, {
			exists: true,
			text: `{"a" : 5 }`,
			testCondition: "when the content is not correctly formatted",
			expectedIndentation: "\t"
		}, {
			exists: true,
			text: `{\r\n "a" : 5 }`,
			testCondition: "when the new line is in Windows format",
			expectedIndentation: " "
		}, {
			exists: true,
			text: `{\r\n\t"a" : 5 }`,
			testCondition: "when the new line is in Windows format",
			expectedIndentation: "\t"
		}
	];
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("fs", fileSystemFile.FileSystem);
	testInjector.register("errors", {
		fail: (...args: any[]) => { throw new Error(args[0]); }
	});

	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("childProcess", childProcessLib.ChildProcess);
	testInjector.register("staticConfig", {
		disableAnalytics: true
	});
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("injector", testInjector);
	return testInjector;
}

describe("FileSystem", () => {
	describe("unzip", () => {
		describe("overwriting files tests", () => {
			let testInjector: IInjector;
			let tempDir: string;
			let fs: IFileSystem;
			let file: string;
			const msg = "data";

			beforeEach(() => {
				testInjector = createTestInjector();
				tempDir = temp.mkdirSync("projectToUnzip");
				fs = testInjector.resolve("fs");
				file = path.join(tempDir, unzippedFileName);
				fs.writeFile(file, msg);
			});
			it("does not overwrite files when overwriteExisitingFiles is false", async () => {
				await fs.unzip(sampleZipFileTest, tempDir, { overwriteExisitingFiles: false }, [unzippedFileName]);
				const data = fs.readFile(file);
				assert.strictEqual(msg, data.toString(), "When overwriteExistingFiles is false, we should not ovewrite files.");
			});

			it("overwrites files when overwriteExisitingFiles is true", async () => {
				await fs.unzip(sampleZipFileTest, tempDir, { overwriteExisitingFiles: true }, [unzippedFileName]);
				const data = fs.readFile(file);
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is true.");
			});

			it("overwrites files when overwriteExisitingFiles is not set", async () => {
				await fs.unzip(sampleZipFileTest, tempDir, {}, [unzippedFileName]);
				const data = fs.readFile(file);
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is not set.");
			});

			it("overwrites files when options is not set", async () => {
				await fs.unzip(sampleZipFileTest, tempDir, undefined, [unzippedFileName]);
				const data = fs.readFile(file);
				assert.notEqual(msg, data.toString(), "We must overwrite files when options is not defined.");
			});
		});

		// NOTE: This tests will never fail on Windows/Mac as file system is case insensitive
		describe("case sensitive tests", () => {
			const commandUnzipFailedMessage = "Command unzip failed with exit code 9";
			it("is case sensitive when options is not defined", async () => {
				const testInjector = createTestInjector();
				const tempDir = temp.mkdirSync("projectToUnzip");
				const fs: IFileSystem = testInjector.resolve("fs");
				if (isOsCaseSensitive(testInjector)) {
					await assert.isRejected(fs.unzip(sampleZipFileTestIncorrectName, tempDir, undefined, [unzippedFileName]), commandUnzipFailedMessage);
				}
			});

			it("is case sensitive when caseSensitive option is not defined", async () => {
				const testInjector = createTestInjector();
				const tempDir = temp.mkdirSync("projectToUnzip");
				const fs: IFileSystem = testInjector.resolve("fs");
				if (isOsCaseSensitive(testInjector)) {
					await assert.isRejected(fs.unzip(sampleZipFileTestIncorrectName, tempDir, {}, [unzippedFileName]), commandUnzipFailedMessage);
				}
			});

			it("is case sensitive when caseSensitive option is true", async () => {
				const testInjector = createTestInjector();
				const tempDir = temp.mkdirSync("projectToUnzip");
				const fs: IFileSystem = testInjector.resolve("fs");
				if (isOsCaseSensitive(testInjector)) {
					await assert.isRejected(fs.unzip(sampleZipFileTestIncorrectName, tempDir, { caseSensitive: true }, [unzippedFileName]), commandUnzipFailedMessage);
				}
			});

			it("is case insensitive when caseSensitive option is false", async () => {
				const testInjector = createTestInjector();
				const tempDir = temp.mkdirSync("projectToUnzip");
				const fs: IFileSystem = testInjector.resolve("fs");
				const file = path.join(tempDir, unzippedFileName);
				await fs.unzip(sampleZipFileTestIncorrectName, tempDir, { caseSensitive: false }, [unzippedFileName]);
				// This will throw error in case file is not extracted
				fs.readFile(file);
			});
		});
	});

	describe("renameIfExists", () => {
		it("returns true when file is renamed", () => {
			const testInjector = createTestInjector();
			const tempDir = temp.mkdirSync("renameIfExists");
			const testFileName = path.join(tempDir, "testRenameIfExistsMethod");
			const newFileName = path.join(tempDir, "newfilename");

			const fs: IFileSystem = testInjector.resolve("fs");
			fs.writeFile(testFileName, "data");

			const result = fs.renameIfExists(testFileName, newFileName);
			assert.isTrue(result, "On successfull rename, result must be true.");
			assert.isTrue(fs.exists(newFileName), "Renamed file should exists.");
			assert.isFalse(fs.exists(testFileName), "Original file should not exist.");
		});

		it("returns false when file does not exist", () => {
			const testInjector = createTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			const newName = "tempDir2";
			const result = fs.renameIfExists("tempDir", newName);
			assert.isFalse(result, "When file does not exist, result must be false.");
			assert.isFalse(fs.exists(newName), "New file should not exist.");
		});
	});

	describe("copyFile", () => {
		let testInjector: IInjector;
		let tempDir: string;
		let testFileName: string;
		let newFileName: string;
		const fileContent = "data";
		let fs: IFileSystem;

		beforeEach(() => {
			testInjector = createTestInjector();
			tempDir = temp.mkdirSync("copyFile");
			testFileName = path.join(tempDir, "testCopyFile");
			newFileName = path.join(tempDir, "newfilename");

			fs = testInjector.resolve("fs");
			fs.writeFile(testFileName, fileContent);
		});

		it("correctly copies file to the same directory", () => {
			fs.copyFile(testFileName, newFileName);
			assert.isTrue(fs.exists(newFileName), "Renamed file should exists.");
			assert.isTrue(fs.exists(testFileName), "Original file should exist.");
			assert.deepEqual(fs.getFsStats(testFileName).size, fs.getFsStats(testFileName).size, "Original file and copied file must have the same size.");
		});

		it("copies file to non-existent directory", () => {
			const newFileNameInSubDir = path.join(tempDir, "subDir", "newfilename");
			assert.isFalse(fs.exists(newFileNameInSubDir));
			fs.copyFile(testFileName, newFileNameInSubDir);
			assert.isTrue(fs.exists(newFileNameInSubDir), "Renamed file should exists.");
			assert.isTrue(fs.exists(testFileName), "Original file should exist.");
			assert.deepEqual(fs.getFsStats(testFileName).size, fs.getFsStats(testFileName).size, "Original file and copied file must have the same size.");
		});

		it("produces correct file when source and target file are the same", () => {
			const originalSize = fs.getFsStats(testFileName).size;
			fs.copyFile(testFileName, testFileName);
			assert.isTrue(fs.exists(testFileName), "Original file should exist.");
			assert.deepEqual(fs.getFsStats(testFileName).size, originalSize, "Original file and copied file must have the same size.");
			assert.deepEqual(fs.readText(testFileName), fileContent, "File content should not be changed.");
		});
	});

	describe("removeEmptyParents", () => {
		let testInjector: IInjector;
		let fs: IFileSystem;
		const notEmptyRootDirectory = path.join("not-empty");
		let removedDirectories: string[];

		beforeEach(() => {
			testInjector = createTestInjector();

			fs = testInjector.resolve("fs");
			removedDirectories = [];
			fs.deleteDirectory = (directory: string) => {
				removedDirectories.push(path.basename(directory));
			};
		});

		it("should remove all empty parents.", () => {
			const emptyDirectories = ["first", "second", "third"];

			let directory = notEmptyRootDirectory;

			_.each(emptyDirectories, (dir: string) => {
				directory = path.join(directory, dir);
			});

			// We need to add the fourth directory because this directory does not actually exist and the method will start deleting its parents.
			directory = path.join(directory, "fourth");

			const originalIsEmptyDir = fs.isEmptyDir;
			fs.isEmptyDir = (dirName: string) => dirName !== notEmptyRootDirectory;

			fs.deleteEmptyParents(directory);
			fs.isEmptyDir = originalIsEmptyDir;

			assert.deepEqual(emptyDirectories, _.reverse(removedDirectories));
		});
	});

	describe("writeJson", () => {
		const testCases = createWriteJsonTestCases();
		let testInjector: IInjector;
		let fs: IFileSystem;

		beforeEach(() => {
			testInjector = createTestInjector();

			fs = testInjector.resolve("fs");
		});

		_.each(testCases, (testCase) => {
			it(`should use the correct indentation ${testCase.testCondition}.`, () => {
				fs.readText = () => testCase.text;
				fs.exists = () => testCase.exists;
				fs.writeFile = () => null;

				let actualIndentation: string;
				const originalJsonStringify = JSON.stringify;

				(<any>JSON).stringify = (value: any, replacer: any[], space: string | number) => {
					actualIndentation = <string>space;
				};

				fs.writeJson("", testCase.text);

				JSON.stringify = originalJsonStringify;

				assert.deepEqual(actualIndentation, testCase.expectedIndentation);
			});
		});
	});
});
