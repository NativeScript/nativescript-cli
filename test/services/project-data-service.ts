import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { ProjectDataService } from "../../lib/services/project-data-service";
import { LoggerStub } from "../stubs";
import { NATIVESCRIPT_PROPS_INTERNAL_DELIMITER, PACKAGE_JSON_FILE_NAME, AssetConstants } from '../../lib/constants';
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { basename } from "path";

const CLIENT_NAME_KEY_IN_PROJECT_FILE = "nativescript";

const getPropertyName = (props: string[]): string => {
	return props.join(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
};

const testData: any = [
	{
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
		"propertyName": getPropertyName(["root", "prop1"]),
		"description": "returns correct result when inner propertyName is passed and the value of it is string"
	},
	{
		"propertyValue": 1234,
		"propertyName": getPropertyName(["root", "prop1"]),
		"description": "returns correct result when inner propertyName is passed and the value of it is number"
	},
	{
		"propertyValue": "expectedData",
		"propertyName": getPropertyName(["root", "prop1", "prop2", "prop3", "prop4"]),
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
		},

		exists: (filePath: string): boolean => basename(filePath) === PACKAGE_JSON_FILE_NAME,

		readJson: (filePath: string): any => null,

		enumerateFilesInDirectorySync: (directoryPath: string,
			filterCallback?: (_file: string, _stat: IFsStats) => boolean,
			opts?: { enumerateDirectories?: boolean, includeEmptyDirectories?: boolean },
			foundFiles?: string[]): string[] => []
	});

	testInjector.register("logger", LoggerStub);

	testInjector.register("projectDataService", ProjectDataService);

	testInjector.register("androidResourcesMigrationService", {
		hasMigrated: (appResourcesDir: string): boolean => true
	});

	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);

	testInjector.register("injector", testInjector);

	testInjector.register("errors", {});

	testInjector.register("projectHelper", {
		sanitizeName: (appName: string): string => appName
	});

	testInjector.register("options", {});

	return testInjector;
};

describe("projectDataService", () => {
	const generateJsonDataFromTestData = (currentTestData: any, skipNativeScriptKey?: boolean) => {
		const props = currentTestData.propertyName.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
		const data: any = {};
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
			projectDataService.setNSValue("projectDir", getPropertyName(["root", "id"]), "2");
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
			const props = currentTestData.propertyName.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
			props.splice(props.length - 1, 1);

			const data: any = {};
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
			projectDataService.removeNSProperty("projectDir", getPropertyName(["root", "id"]));
			assert.deepEqual(dataPassedToWriteJson, { nativescript: { root: { constantItem: "myValue" } } });
		});
	});

	describe("removeDependency", () => {
		it("removes specified dependency from project file", () => {
			const currentTestData = {
				propertyName: getPropertyName(["dependencies", "myDeps"]),
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

	describe("getAssetsStructure", () => {
		it("does not fail when App_Resources/Android and App_Resources/iOS do not exist", async () => {
			const defaultEmptyData: any = {};
			defaultEmptyData[CLIENT_NAME_KEY_IN_PROJECT_FILE] = {};
			const testInjector = createTestInjector(JSON.stringify(defaultEmptyData));
			const fs = testInjector.resolve<IFileSystem>("fs");
			fs.readJson = (filePath: string): any => {
				if (basename(filePath) === AssetConstants.imageDefinitionsFileName) {
					return { android: {}, ios: {} };
				}

				throw new Error(`Unable to read file ${filePath}`);
			};

			const projectDataService = testInjector.resolve<IProjectDataService>("projectDataService");
			const assetStructure = await projectDataService.getAssetsStructure({ projectDir: "." });
			const emptyAssetStructure: IAssetGroup = {
				icons: {
					images: []
				},
				splashBackgrounds: {
					images: []
				},
				splashCenterImages: {
					images: []
				},
				splashImages: {
					images: []
				}
			};

			assert.deepEqual(assetStructure, { ios: emptyAssetStructure, android: _.merge(_.cloneDeep(emptyAssetStructure), { splashImages: null }) });
		});
	});
});
