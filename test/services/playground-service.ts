import { assert } from "chai";
import { FileSystemStub } from "../stubs";
import { PlaygroundService } from "../../lib/services/playground-service";
import { Yok } from "../../lib/common/yok";
import { IProjectDataService, IProjectData } from "../../lib/definitions/project";
import { IInjector } from "../../lib/common/definitions/yok";
import { IFileSystem, IPlaygroundService } from "../../lib/common/declarations";

let userSettings: any = null;

function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("playgroundService", PlaygroundService);
	testInjector.register("fs", FileSystemStub);
	testInjector.register("projectDataService", {});
	testInjector.register("userSettingsService", {});
	testInjector.register("injector", testInjector);

	return testInjector;
}

function mockPlaygroundService(testInjector: IInjector, data?: { projectData?: any, nativescriptKey?: any, userSettingsData?: any}) {
	const projectDataService = testInjector.resolve<IProjectDataService>("projectDataService");
	projectDataService.getProjectData = () => (data && data.projectData) || <IProjectData>{};

	const userSettingsService = testInjector.resolve("userSettingsService");
	userSettingsService.getSettingValue = async (keyName: string) => {
		return data && data.userSettingsData ? data.userSettingsData[keyName] : null;
	};
	userSettingsService.saveSettings = async (settings: any) => { userSettings = settings; };

	const fs = testInjector.resolve<IFileSystem>("fs");
	fs.readJson = () => (data && data.nativescriptKey) || {};
}

describe("PlaygroundService", () => {
	let testInjector: IInjector = null;
	let playgroundService: IPlaygroundService = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		playgroundService = testInjector.resolve("playgroundService");
	});

	describe("getPlaygroundInfo", () => {
		it("should return null when projectDir is not specified and no playground data is saved in userSettings file", async () => {
			mockPlaygroundService(testInjector, { userSettingsData: null });
			const result = await playgroundService.getPlaygroundInfo();
			assert.equal(result, null);
		});
		it("should return saved playgroundData from userSettings file when projectDir is not specified and playground data is already saved in userSettings file", async () => {
			mockPlaygroundService(testInjector, { userSettingsData: {playground: {id: "test-playground-identifier", usedTutorial: false}}});
			const actualResult = await playgroundService.getPlaygroundInfo();
			const expectedResult = {id: "test-playground-identifier", usedTutorial: false};
			assert.deepStrictEqual(actualResult, expectedResult);
		});
		it("should return null when projectFile has no nativescript key in package.json file and no playground data is saved in userSettings file", async () => {
			mockPlaygroundService(testInjector, { userSettingsData: null });
			const result = await playgroundService.getPlaygroundInfo();
			assert.equal(result, null);
		});
		it("should return saved playgroundData from userSettings file when projectFile has no nativescript key in package.json and some playground data is already saved in userSettings file", async () => {
			mockPlaygroundService(testInjector, { userSettingsData: {playground: {id: "test-playground-identifier", usedTutorial: true}}});
			const actualResult = await playgroundService.getPlaygroundInfo();
			const expectedResult = {id: "test-playground-identifier", usedTutorial: true};
			assert.deepStrictEqual(actualResult, expectedResult);
		});

		describe("should return playgroundInfo when project has playground key in package.json", () => {
			it("and no usedTutorial", async () => {
				const nativescriptKey = {
					nativescript: {
						playground: {
							id: "test-guid"
						}
					}
				};
				mockPlaygroundService(testInjector, { nativescriptKey });
				const actualResult = await playgroundService.getPlaygroundInfo();
				const expectedResult = { id: "test-guid", usedTutorial: false };
				assert.deepStrictEqual(actualResult, expectedResult);
			});
			it("and usedTutorial is true", async() => {
				const nativescriptKey = {
					nativescript: {
						playground: {
							id: "test-guid",
							usedTutorial: true
						}
					}
				};
				mockPlaygroundService(testInjector, { nativescriptKey });
				const actualResult = await playgroundService.getPlaygroundInfo();
				const expectedResult = { id: 'test-guid', usedTutorial: true };
				assert.deepStrictEqual(actualResult, expectedResult);
			});
			it("and usedTutorial is false", async () => {
				const nativescriptKey = {
					nativescript: {
						playground: {
							id: "playground-test-guid",
							usedTutorial: false
						}
					}
				};
				mockPlaygroundService(testInjector, { nativescriptKey });
				const actualResult = await playgroundService.getPlaygroundInfo();
				const expectedResult = { id: "playground-test-guid", usedTutorial: false };
				assert.deepStrictEqual(actualResult, expectedResult);
			});
		});

		describe("should return playgroundInfo from userSettings file", () => {
			it("when usedTutorial is true", async () => {
				mockPlaygroundService(testInjector, { userSettingsData: {playground: {id: "test-playground-identifier", usedTutorial: true}}});
				const actualResult = await playgroundService.getPlaygroundInfo();
				const expectedResult = { id: 'test-playground-identifier', usedTutorial: true };
				assert.deepStrictEqual(actualResult, expectedResult);
			});
			it("when usedTutorial is false", async () => {
				mockPlaygroundService(testInjector, { userSettingsData: {playground: {id: "test-playground-identifier", usedTutorial: false}}});
				const actualResult = await playgroundService.getPlaygroundInfo();
				const expectedResult = { id: 'test-playground-identifier', usedTutorial: false };
				assert.deepStrictEqual(actualResult, expectedResult);
			});
		});

		it("should return undefined when userSettings file does not have playground key", async () => {
			mockPlaygroundService(testInjector, { userSettingsData: {}});
			const actualResult = await playgroundService.getPlaygroundInfo();
			assert.deepStrictEqual(actualResult, undefined);
		});
		it("should replace playgroundId when another id is already saved in userSettings file", async () => {
			const nativescriptKey = {
				nativescript: {
					playground: {
						id: "test-guid"
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey });
			let actualResult = await playgroundService.getPlaygroundInfo();
			let expectedResult = { id: "test-guid", usedTutorial: false };
			assert.deepStrictEqual(actualResult, expectedResult);

			const secondNativescriptKey = {
				nativescript: {
					playground: {
						id: "another-test-guid"
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey: secondNativescriptKey });
			actualResult = await playgroundService.getPlaygroundInfo();
			expectedResult = { id: 'another-test-guid', usedTutorial: false };
			assert.deepStrictEqual(actualResult, expectedResult);
			assert.deepStrictEqual(userSettings, { playground: { id: 'another-test-guid', usedTutorial: false }});
		});
		it("should replace usedTutorial when false value is already saved in userSettings file", async () => {
			const nativescriptKey = {
				nativescript: {
					playground: {
						id: "test-guid",
						usedTutorial: false
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey });
			let actualResult = await playgroundService.getPlaygroundInfo();
			let expectedResult = { id: "test-guid", usedTutorial: false };
			assert.deepStrictEqual(actualResult, expectedResult);

			const secondNativescriptKey = {
				nativescript: {
					playground: {
						id: "another-test-guid",
						usedTutorial: true
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey: secondNativescriptKey, userSettingsData: {playground: { id: "test-guid", usedTutorial: false }} });
			actualResult = await playgroundService.getPlaygroundInfo();
			expectedResult = { id: 'another-test-guid', usedTutorial: true };
			assert.deepStrictEqual(actualResult, expectedResult);
		});
		it("shouldn't replace usedTutorial when true value is already saved in userSettings file", async () => {
			const nativescriptKey = {
				nativescript: {
					playground: {
						id: "test-guid",
						usedTutorial: true
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey });
			let actualResult = await playgroundService.getPlaygroundInfo();
			let expectedResult = { id: "test-guid", usedTutorial: true };
			assert.deepStrictEqual(actualResult, expectedResult);

			const secondNativescriptKey = {
				nativescript: {
					playground: {
						id: "another-test-guid",
						usedTutorial: false
					}
				}
			};
			mockPlaygroundService(testInjector, { nativescriptKey: secondNativescriptKey, userSettingsData: {playground: { id: "test-guid", usedTutorial: true }} });
			actualResult = await playgroundService.getPlaygroundInfo();
			expectedResult = { id: 'another-test-guid', usedTutorial: true };
			assert.deepStrictEqual(actualResult, expectedResult);
		});
	});
});
