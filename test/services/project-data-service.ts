import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { ProjectDataService } from "../../lib/services/project-data-service";
import { LoggerStub } from "../stubs";

const CLIENT_NAME_KEY_IN_PROJECT_FILE = "nativescript";

const testData: any = [{
	"propertyValue": 1,
	"propertyName": "root",
	"description": "returns correct result when a single propertyName is passed and the value of it is number"
},
{
	"propertyValue": "expectedData",
	"propertyName": "root",
	"description": "returns correct result when a single propertyName is passed and the value of it is string"
},
{
	"propertyValue": "expectedData",
	"propertyName": "root.prop1",
	"description": "returns correct result when inner propertyName is passed and the value of it is string"
},
{
	"propertyValue": 1234,
	"propertyName": "root.prop1",
	"description": "returns correct result when inner propertyName is passed and the value of it is number"
},
{
	"propertyValue": "expectedData",
	"propertyName": "root.prop1.prop2.prop3.prop4",
	"description": "returns correct result when really inner propertyName is passed and the value of it is string"
}
];

const createTestInjector = (readTextData?: string): IInjector => {
	const testInjector = new Yok();
	testInjector.register("staticConfig", {
		CLIENT_NAME_KEY_IN_PROJECT_FILE: CLIENT_NAME_KEY_IN_PROJECT_FILE,
		PROJECT_FILE_NAME: "package.json"
	});

	testInjector.register("fs", {
		writeJson: (filename: string, data: any, space?: string, encoding?: string): void => {
			/** intentionally left blank */
		},

		readText: (filename: string, encoding?: IReadFileOptions | string): string => {
			return readTextData;
		}
	});

	testInjector.register("logger", LoggerStub);

	testInjector.register("projectDataService", ProjectDataService);

	testInjector.register("injector", testInjector);

	return testInjector;
};

describe("projectDataService", () => {
	const generateJsonDataFromTestData = (currentTestData: any, skipNativeScriptKey?: boolean) => {
		const props = currentTestData.propertyName.split(".");
		let data: any = {};
		let currentData: any = skipNativeScriptKey ? data : (data[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {});

		_.each(props, (prop, index: number) => {
			if (index === (props.length - 1)) {
				currentData[prop] = currentTestData.propertyValue;
			} else {
				currentData[prop] = {};
			}

			currentData = currentData[prop];
		});

		return data;
	};

	const generateFileContentFromTestData = (currentTestData: any, skipNativeScriptKey?: boolean) => {
		const data = generateJsonDataFromTestData(currentTestData, skipNativeScriptKey);
		return JSON.stringify(data);
	};

	describe("getNSValue", () => {

		_.each(testData, currentTestData => {

			it(currentTestData.description, () => {
				const testInjector = createTestInjector(generateFileContentFromTestData(currentTestData));
				const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");

				const actualValue = projectDataService.getNSValue("projectDir", currentTestData.propertyName);
				assert.deepEqual(actualValue, currentTestData.propertyValue);
			});

		});
	});

	describe("setNSValue", () => {

		_.each(testData, currentTestData => {

			it(currentTestData.description, () => {
				const defaultEmptyData: any = {};
				defaultEmptyData[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {};

				const testInjector = createTestInjector(JSON.stringify(defaultEmptyData));
				const fs: IFileSystem = testInjector.resolve("fs");

				let dataPassedToWriteJson: any = null;
				fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
					dataPassedToWriteJson = data;
				};

				const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
				projectDataService.setNSValue("projectDir", currentTestData.propertyName, currentTestData.propertyValue);

				assert.deepEqual(dataPassedToWriteJson, generateJsonDataFromTestData(currentTestData));
				assert.isTrue(!!dataPassedToWriteJson[CLIENT_NAME_KEY_IN_PROJECT_FILE], "Data passed to write JSON must contain nativescript key.");
			});

		});

		it("removes only the selected property", () => {
			const initialData: any = {};
			initialData[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {
				"root": {
					"id": "1",
					"constantItem": "myValue"
				}
			};

			const testInjector = createTestInjector(JSON.stringify(initialData));
			const fs: IFileSystem = testInjector.resolve("fs");

			let dataPassedToWriteJson: any = null;
			fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
				dataPassedToWriteJson = data;
			};

			const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
			projectDataService.setNSValue("projectDir", "root.id", "2");
			const expectedData = _.cloneDeep(initialData);
			expectedData[CLIENT_NAME_KEY_IN_PROJECT_FILE].root.id = "2";
			assert.isTrue(!!dataPassedToWriteJson[CLIENT_NAME_KEY_IN_PROJECT_FILE], "Data passed to write JSON must contain nativescript key.");
			assert.deepEqual(dataPassedToWriteJson, expectedData);
			assert.deepEqual(dataPassedToWriteJson[CLIENT_NAME_KEY_IN_PROJECT_FILE].root.id, "2");
			assert.deepEqual(dataPassedToWriteJson[CLIENT_NAME_KEY_IN_PROJECT_FILE].root.constantItem, "myValue");
		});

	});

	describe("removeNSProperty", () => {

		const generateExpectedDataFromTestData = (currentTestData: any) => {
			const props = currentTestData.propertyName.split(".");
			props.splice(props.length - 1, 1);

			let data: any = {};
			let currentData: any = data[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {};

			_.each(props, (prop) => {
				currentData = currentData[prop] = {};
			});

			return data;
		};

		_.each(testData, currentTestData => {

			it(currentTestData.description, () => {
				generateFileContentFromTestData(currentTestData);

				const testInjector = createTestInjector(generateFileContentFromTestData(currentTestData));
				const fs: IFileSystem = testInjector.resolve("fs");

				let dataPassedToWriteJson: any = null;
				fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
					dataPassedToWriteJson = data;
				};

				const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
				projectDataService.removeNSProperty("projectDir", currentTestData.propertyName);

				assert.deepEqual(dataPassedToWriteJson, generateExpectedDataFromTestData(currentTestData));
				assert.isTrue(!!dataPassedToWriteJson[CLIENT_NAME_KEY_IN_PROJECT_FILE], "Data passed to write JSON must contain nativescript key.");
			});

		});

		it("removes only the selected property", () => {
			const initialData: any = {};
			initialData[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {
				"root": {
					"id": "1",
					"constantItem": "myValue"
				}
			};

			const testInjector = createTestInjector(JSON.stringify(initialData));
			const fs: IFileSystem = testInjector.resolve("fs");

			let dataPassedToWriteJson: any = null;
			fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
				dataPassedToWriteJson = data;
			};

			const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
			projectDataService.removeNSProperty("projectDir", "root.id");
			assert.deepEqual(dataPassedToWriteJson, { nativescript: { root: { constantItem: "myValue" } } });
		});
	});

	describe("removeDependency", () => {
		it("removes specified dependency from project file", () => {
			let currentTestData = {
				propertyName: "dependencies.myDeps",
				propertyValue: "1.0.0"
			};

			const testInjector = createTestInjector(generateFileContentFromTestData(currentTestData, true));
			const fs: IFileSystem = testInjector.resolve("fs");

			let dataPassedToWriteJson: any = null;
			fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
				dataPassedToWriteJson = data;
			};

			const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
			projectDataService.removeDependency("projectDir", "myDeps");

			assert.deepEqual(dataPassedToWriteJson, { dependencies: {} });
		});
	});
});
