import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { ProjectDataService } from "../../lib/services/project-data-service";
import { LoggerStub, ProjectDataStub } from "../stubs";
import { NATIVESCRIPT_PROPS_INTERNAL_DELIMITER, PACKAGE_JSON_FILE_NAME, CONFIG_NS_FILE_NAME, AssetConstants, ProjectTypes } from '../../lib/constants';
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { basename, join } from "path";
import { FileSystem } from "../../lib/common/file-system";
import { regExpEscape } from "../../lib/common/helpers";

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

const createTestInjector = (packageJsonContent?: string, nsConfigContent?: string): IInjector => {
	const testInjector = new Yok();
	testInjector.register("projectData", ProjectDataStub);
	testInjector.register("staticConfig", {
		CLIENT_NAME_KEY_IN_PROJECT_FILE: CLIENT_NAME_KEY_IN_PROJECT_FILE,
		PROJECT_FILE_NAME: "package.json"
	});

	testInjector.register("fs", {
		writeJson: (filename: string, data: any, space?: string, encoding?: string): void => {
			/** intentionally left blank */
		},

		readText: (filename: string, encoding?: IReadFileOptions | string): string => {
			if (filename.indexOf("package.json") > -1) {
				return packageJsonContent;
			} else if (filename.indexOf("nsconfig.json") > -1) {
				return nsConfigContent;
			}
		},

		exists: (filePath: string): boolean => (basename(filePath) === PACKAGE_JSON_FILE_NAME || basename(filePath) === CONFIG_NS_FILE_NAME),

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

	describe("removeNSConfigProperty", () => {

		const generateExpectedDataFromTestData = (currentTestData: any) => {
			const props = currentTestData.propertyName.split(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER);
			props.splice(props.length - 1, 1);

			const data: any = {};
			let currentData: any = data;

			_.each(props, (prop) => {
				currentData = currentData[prop] = {};
			});

			return data;
		};

		_.each(testData, currentTestData => {

			it(currentTestData.description, () => {
				const testInjector = createTestInjector(null, generateFileContentFromTestData(currentTestData, true));
				const fs: IFileSystem = testInjector.resolve("fs");

				let dataPassedToWriteJson: any = null;
				fs.writeJson = (filename: string, data: any, space?: string, encoding?: string): void => {
					dataPassedToWriteJson = data;
				};

				const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
				const propDelimiterRegExp = new RegExp(regExpEscape(NATIVESCRIPT_PROPS_INTERNAL_DELIMITER), "g");
				const propertySelector = currentTestData.propertyName.replace(propDelimiterRegExp, ".");
				projectDataService.removeNSConfigProperty("projectDir", propertySelector);

				assert.deepEqual(dataPassedToWriteJson, generateExpectedDataFromTestData(currentTestData));
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

	describe("getAppExecutableFiles", () => {
		const appDirectoryPath = "appDirPath";
		const appResourcesDirectoryPath = join(appDirectoryPath, "App_Resources");

		const getAppExecutableFilesTestData = [
			{
				projectType: ProjectTypes.NgFlavorName,
				appFiles: [
					"component1.ts",
					"component1.js",
					"component2.ts",
					"App_Resources"
				],
				expectedResult: [
					join(appDirectoryPath, "component1.ts"),
					join(appDirectoryPath, "component2.ts"),
				]
			},
			{
				projectType: ProjectTypes.TsFlavorName,
				appFiles: [
					"component1.ts",
					"component1.js",
					"component2.ts",
					"App_Resources"
				],
				expectedResult: [
					join(appDirectoryPath, "component1.ts"),
					join(appDirectoryPath, "component2.ts"),
				]
			},
			{
				projectType: ProjectTypes.JsFlavorName,
				appFiles: [
					"component1.ts",
					"component1.js",
					"component2.ts",
					"App_Resources"
				],
				expectedResult: [
					join(appDirectoryPath, "component1.js"),
				]
			},
			{
				projectType: ProjectTypes.VueFlavorName,
				appFiles: [
					"component1.ts",
					"component1.js",
					"component2.ts",
					"App_Resources"
				],
				expectedResult: [
					join(appDirectoryPath, "component1.js"),
				]
			}
		];

		const setupTestCase = (testCase: any): { projectDataService: IProjectDataService, testInjector: IInjector } => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve<IFileSystem>("fs");
			const realFileSystemInstance = <FileSystem>testInjector.resolve(FileSystem);
			fs.enumerateFilesInDirectorySync = realFileSystemInstance.enumerateFilesInDirectorySync;

			const appResourcesContent: string[] = [
				"file1.ts",
				"file1.js"
			];

			fs.exists = (filePath: string) => true;
			fs.getFsStats = (filePath: string) => {
				if (filePath === appDirectoryPath || filePath === appResourcesDirectoryPath) {
					return <any>{ isDirectory: () => true };
				}

				return <any>{ isDirectory: () => false };
			};

			fs.readDirectory = (dirPath: string) => {
				if (dirPath === appDirectoryPath) {
					return testCase.appFiles;
				}

				if (dirPath === appResourcesDirectoryPath) {
					return appResourcesContent;
				}

				return [];
			};

			const projectDataService = testInjector.resolve<IProjectDataService>("projectDataService");
			projectDataService.getProjectData = () => <any>({
				appDirectoryPath,
				appResourcesDirectoryPath,
				projectType: testCase.projectType
			});

			return { projectDataService, testInjector };
		};

		getAppExecutableFilesTestData.forEach(testCase => {
			it(`returns correct files for application type ${testCase.projectType}`, () => {
				const { projectDataService } = setupTestCase(testCase);
				const appExecutableFiles = projectDataService.getAppExecutableFiles("projectDir");
				assert.deepEqual(appExecutableFiles, testCase.expectedResult);
			});
		});

		it("returns correct files when inner dirs exist in app dir", () => {
			const innerDirName = "innerDir";
			const innerDirPath = join(appDirectoryPath, innerDirName);
			const testCase = {
				projectType: ProjectTypes.NgFlavorName,
				appFiles: [
					"component1.ts",
					"component1.js",
					"component2.ts",
					"App_Resources",
					innerDirName
				],
				expectedResult: [
					join(appDirectoryPath, "component1.ts"),
					join(appDirectoryPath, "component2.ts"),
					join(innerDirPath, "subcomponent1.ts"),
					join(innerDirPath, "subcomponent2.ts"),
				]
			};
			const { projectDataService, testInjector } = setupTestCase(testCase);
			const fs = testInjector.resolve<IFileSystem>("fs");
			const baseFsReadDirectory = fs.readDirectory;
			const innerDirContents = [
				"subcomponent1.ts",
				"subcomponent1.js",
				"subcomponent2.ts",
				"subcomponent2.js",
			];

			fs.readDirectory = (dirPath) => {
				if (dirPath === innerDirPath) {
					return innerDirContents;
				}

				return baseFsReadDirectory(dirPath);
			};

			const baseFsGetFsStats = fs.getFsStats;
			fs.getFsStats = (filePath: string) => {
				if (filePath === innerDirPath) {
					return <any>{ isDirectory: () => true };
				}

				return baseFsGetFsStats(filePath);
			};

			const appExecutableFiles = projectDataService.getAppExecutableFiles("projectDir");
			assert.deepEqual(appExecutableFiles, testCase.expectedResult);
		});
	});
});
