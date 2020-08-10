import { MetadataFilteringService } from "../../lib/services/metadata-filtering-service";
import { Yok } from "../../lib/common/yok";
import { LoggerStub, FileSystemStub } from "../stubs";
import { assert } from "chai";
import * as path from "path";
import { MetadataFilteringConstants } from "../../lib/constants";
import { EOL } from "os";
import { IProjectData } from "../../lib/definitions/project";
import { IDependencyData } from "../../lib/declarations";
import { IPluginData } from "../../lib/definitions/plugins";
import { IPlatformData } from "../../lib/definitions/platform";
import { IMetadataFilteringService } from "../../lib/definitions/metadata-filtering-service";
import { IInjector } from "../../lib/common/definitions/yok";
import { IDictionary } from "../../lib/common/declarations";

describe("metadataFilteringService", () => {
	const platform = "platform";
	const projectDir = "projectDir";
	const projectRoot = path.join(projectDir, "platforms", platform);
	const projectData: any = {
		appResourcesDirectoryPath: path.join(projectDir, "App_Resources")
	};
	const blacklistArray: string[] = ["blacklisted1", "blacklisted2"];
	const whitelistArray: string[] = ["whitelisted1", "whitelisted2"];
	const appResourcesNativeApiUsageFilePath = path.join(projectData.appResourcesDirectoryPath, platform, MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME);
	const pluginPlatformsDir = path.join("pluginDir", platform);
	const pluginNativeApiUsageFilePath = path.join(pluginPlatformsDir, MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME);
	const pluginsUses: string[] = ["pluginUses1", "pluginUses2"];

	const createTestInjector = (input?: { hasPlugins: boolean }): IInjector => {
		const testInjector = new Yok();
		testInjector.register("logger", LoggerStub);
		testInjector.register("fs", FileSystemStub);
		testInjector.register("pluginsService", {
			getAllProductionPlugins: (prjData: IProjectData, dependencies?: IDependencyData[]): IPluginData[] => {
				const plugins = !!(input && input.hasPlugins) ? [
					<any>{
						pluginPlatformsFolderPath: (pl: string) => pluginPlatformsDir
					}
				] : [];

				return plugins;
			}
		});
		testInjector.register("mobileHelper", {
			normalizePlatformName: (pl: string) => pl
		});
		testInjector.register("platformsDataService", {
			getPlatformData: (pl: string, prjData: IProjectData): IPlatformData => (<any>{ projectRoot })
		});
		return testInjector;
	};

	describe("generateMetadataFilters", () => {
		const mockFs = (input: { testInjector: IInjector, readJsonData?: any, writeFileAction?: (filePath: string, data: string) => void, existingFiles?: any[] }): { fs: FileSystemStub, dataWritten: IDictionary<any> } => {
			const fs = input.testInjector.resolve<FileSystemStub>("fs");
			const dataWritten: IDictionary<any> = {};

			if (input.writeFileAction) {
				fs.writeFile = (filePath: string, data: string) => input.writeFileAction(filePath, data);
			} else {
				fs.writeFile = (filePath: string, data: string) => dataWritten[filePath] = data;
			}

			if (input.readJsonData) {
				fs.readJson = (filePath: string) => input.readJsonData[filePath];
			}

			if (input.existingFiles) {
				fs.exists = (filePath: string) => input.existingFiles.indexOf(filePath) !== -1;
			}

			return { fs, dataWritten };
		};

		it("deletes previously generated files for metadata filtering", () => {
			const testInjector = createTestInjector();
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { fs } = mockFs({
				testInjector, writeFileAction: (filePath: string, data: string) => {
					throw new Error(`No data should be written when the ${MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME} does not exist in App_Resource/<platform>`);
				}
			});

			metadataFilteringService.generateMetadataFilters(projectData, platform);

			const expectedDeletedFiles = [
				path.join(projectRoot, MetadataFilteringConstants.WHITELIST_FILE_NAME),
				path.join(projectRoot, MetadataFilteringConstants.BLACKLIST_FILE_NAME)
			];
			assert.deepEqual(fs.deletedFiles, expectedDeletedFiles);
		});

		it(`generates ${MetadataFilteringConstants.BLACKLIST_FILE_NAME} when the file ${MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME} exists in App_Resources/<platform>`, () => {
			const testInjector = createTestInjector();
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { dataWritten } = mockFs({
				testInjector,
				existingFiles: [appResourcesNativeApiUsageFilePath],
				readJsonData: { [`${appResourcesNativeApiUsageFilePath}`]: { blacklist: blacklistArray } }
			});

			metadataFilteringService.generateMetadataFilters(projectData, platform);

			assert.deepEqual(dataWritten, { [path.join(projectRoot, MetadataFilteringConstants.BLACKLIST_FILE_NAME)]: blacklistArray.join(EOL) });
		});

		const getExpectedWhitelistContent = (input: { applicationWhitelist?: string[], pluginWhitelist?: string[] }): string => {
			let finalContent = "";
			if (input.pluginWhitelist) {
				finalContent += `// Added from: ${pluginNativeApiUsageFilePath}${EOL}${input.pluginWhitelist.join(EOL)}${EOL}// Finished part from ${pluginNativeApiUsageFilePath}${EOL}`;
			}

			if (input.applicationWhitelist) {
				if (finalContent !== "") {
					finalContent += EOL;
				}

				finalContent += `// Added from application${EOL}${input.applicationWhitelist.join(EOL)}${EOL}// Finished part from application${EOL}`;
			}

			return finalContent;
		};

		it(`generates ${MetadataFilteringConstants.WHITELIST_FILE_NAME} when the file ${MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME} exists in App_Resources/<platform>`, () => {
			const testInjector = createTestInjector();
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { dataWritten } = mockFs({
				testInjector,
				existingFiles: [appResourcesNativeApiUsageFilePath],
				readJsonData: { [`${appResourcesNativeApiUsageFilePath}`]: { whitelist: whitelistArray } },
			});

			metadataFilteringService.generateMetadataFilters(projectData, platform);
			assert.deepEqual(dataWritten, { [path.join(projectRoot, MetadataFilteringConstants.WHITELIST_FILE_NAME)]: getExpectedWhitelistContent({ applicationWhitelist: whitelistArray }) });
		});

		it(`generates ${MetadataFilteringConstants.WHITELIST_FILE_NAME} with content from plugins when the file ${MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME} exists in App_Resources/<platform> and whitelist-plugins-usages is true`, () => {
			const testInjector = createTestInjector({ hasPlugins: true });
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { dataWritten } = mockFs({
				testInjector,
				existingFiles: [appResourcesNativeApiUsageFilePath, pluginNativeApiUsageFilePath],
				readJsonData: {
					[`${appResourcesNativeApiUsageFilePath}`]: { ["whitelist-plugins-usages"]: true },
					[`${pluginNativeApiUsageFilePath}`]: { uses: whitelistArray }
				},
			});

			metadataFilteringService.generateMetadataFilters(projectData, platform);
			assert.deepEqual(dataWritten, { [path.join(projectRoot, MetadataFilteringConstants.WHITELIST_FILE_NAME)]: getExpectedWhitelistContent({ pluginWhitelist: whitelistArray }) });
		});

		it(`generates all files when both plugins and applications filters are included`, () => {
			const testInjector = createTestInjector({ hasPlugins: true });
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { dataWritten } = mockFs({
				testInjector,
				existingFiles: [appResourcesNativeApiUsageFilePath, pluginNativeApiUsageFilePath],
				readJsonData: {
					[`${appResourcesNativeApiUsageFilePath}`]: {
						whitelist: whitelistArray,
						blacklist: blacklistArray,
						["whitelist-plugins-usages"]: true
					},
					[`${pluginNativeApiUsageFilePath}`]: { uses: pluginsUses }
				},
			});

			metadataFilteringService.generateMetadataFilters(projectData, platform);
			const expectedWhitelist = getExpectedWhitelistContent({ pluginWhitelist: pluginsUses, applicationWhitelist: whitelistArray });

			assert.deepEqual(dataWritten, {
				[path.join(projectRoot, MetadataFilteringConstants.WHITELIST_FILE_NAME)]: expectedWhitelist,
				[path.join(projectRoot, MetadataFilteringConstants.BLACKLIST_FILE_NAME)]: blacklistArray.join(EOL)
			});
		});

		it(`skips plugins ${MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME} files when whitelist-plugins-usages in App_Resources is false`, () => {
			const testInjector = createTestInjector({ hasPlugins: true });
			const metadataFilteringService: IMetadataFilteringService = testInjector.resolve(MetadataFilteringService);
			const { dataWritten } = mockFs({
				testInjector,
				existingFiles: [appResourcesNativeApiUsageFilePath, pluginNativeApiUsageFilePath],
				readJsonData: {
					[`${appResourcesNativeApiUsageFilePath}`]: {
						whitelist: whitelistArray,
						blacklist: blacklistArray,
						["whitelist-plugins-usages"]: false
					},
					[`${pluginNativeApiUsageFilePath}`]: { uses: pluginsUses }
				},
			});

			metadataFilteringService.generateMetadataFilters(projectData, "platform");
			const expectedWhitelist = getExpectedWhitelistContent({ applicationWhitelist: whitelistArray });

			assert.deepEqual(dataWritten, {
				[path.join(projectRoot, MetadataFilteringConstants.WHITELIST_FILE_NAME)]: expectedWhitelist,
				[path.join(projectRoot, MetadataFilteringConstants.BLACKLIST_FILE_NAME)]: blacklistArray.join(EOL)
			});
		});
	});
});
