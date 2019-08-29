import { Yok } from "../../../yok";
import { assert } from "chai";
import { CommonLoggerStub } from "../stubs";
import { JsonFileSettingsService } from "../../../services/json-file-settings-service";

const originalDateNow = Date.now;

describe("jsonFileSettingsService", () => {
	const jsonFileSettingsPath = "abc.json";
	let dataPassedToWriteFile: { filename: string, data: string }[] = [];
	let dataPassedToWriteJson: { filename: string, data: any }[] = [];
	let dataInFile: IDictionary<any> = {};
	let deletedFiles: string[] = [];

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();

		testInjector.register("fs", {
			exists: (filePath: string): boolean => true,
			writeFile: (filename: string, data: string, encoding?: string): void => {
				dataPassedToWriteFile.push({ filename, data });
			},
			setCurrentUserAsOwner: async (path: string, owner: string): Promise<void> => undefined,
			readText: (filename: string, encoding?: IReadFileOptions | string): string => JSON.stringify(dataInFile[filename]),
			deleteFile: (filePath: string): void => {
				deletedFiles.push(filePath);
			},
			writeJson: (filename: string, data: any, space?: string, encoding?: string): void => {
				dataPassedToWriteJson.push({ filename, data });
			}
		});
		testInjector.register("lockService", {
			executeActionWithLock: async (action: () => Promise<any>, lockFilePath?: string, lockOpts?: ILockOptions): Promise<any> => {
				return action();
			}
		});
		testInjector.register("logger", CommonLoggerStub);
		testInjector.register("jsonFileSettingsService", JsonFileSettingsService);
		return testInjector;
	};

	beforeEach(() => {
		dataPassedToWriteFile = [];
		dataPassedToWriteJson = [];
		dataInFile = {};
		deletedFiles = [];
		Date.now = originalDateNow;
	});

	describe("getSettingValue", () => {
		it("returns correct data without cache", async () => {
			dataInFile = { [jsonFileSettingsPath]: { prop1: 1 } };

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const result = await jsonFileSettingsService.getSettingValue<number>("prop1");
			assert.equal(result, 1);
		});

		it("returns null when file does not contain the required property", async () => {
			dataInFile = { [jsonFileSettingsPath]: { prop1: 1 } };

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const result = await jsonFileSettingsService.getSettingValue<number>("prop2");
			assert.equal(result, null);
		});

		it("returns result when data in file has cache information and the call does not require cache options to be checked", async () => {
			const currentTime = Date.now();
			dataInFile = {
				[jsonFileSettingsPath]: {
					prop1: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: 1
					}
				}
			};

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const result = await jsonFileSettingsService.getSettingValue<number>("prop1");
			assert.equal(result, 1);
		});

		it("returns null when data in file does not have caching information and request is to use cacheOptions", async () => {
			dataInFile = { [jsonFileSettingsPath]: { prop1: 1 } };

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const result = await jsonFileSettingsService.getSettingValue<number>("prop1", { cacheTimeout: 10000 });
			assert.equal(result, null);
		});

		it("returns result when data in file has cache information and the cache is not outdated", async () => {
			const currentTime = Date.now();
			dataInFile = {
				[jsonFileSettingsPath]: {
					prop1: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: 1
					}
				}
			};

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const result = await jsonFileSettingsService.getSettingValue<number>("prop1", { cacheTimeout: 100000 });
			assert.equal(result, 1);
		});

		it("returns null when data in file has cache information and the cache is outdated", async () => {
			const currentTime = Date.now();
			dataInFile = {
				[jsonFileSettingsPath]: {
					prop1: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: 1
					}
				}
			};

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });

			const result = await new Promise((resolve, reject) => {
				setTimeout(() => {
					jsonFileSettingsService.getSettingValue<number>("prop1", { cacheTimeout: 1 }).then(resolve, reject);
				}, 2);
			});

			assert.equal(result, null);
		});
	});

	describe("saveSettings", () => {
		it("writes passed data without cache when cache data is not passed", async () => {
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const settingsToSave: any = {
				prop1: {
					innerProp1: 1
				},
				prop2: "value2"
			};

			await jsonFileSettingsService.saveSettings(settingsToSave);
			assert.deepEqual(dataPassedToWriteJson, [{ filename: jsonFileSettingsPath, data: settingsToSave }]);
		});

		it("writes full file data and modifies only properties included in the passed object", async () => {
			dataInFile = {
				[jsonFileSettingsPath]: {
					prop0: {
						innerProp1: 1
					},
					prop1: "value2"
				}
			};

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const settingsToSave: any = {
				prop1: {
					innerProp1: 1
				},
				prop2: "value2"
			};

			await jsonFileSettingsService.saveSettings(settingsToSave);
			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop0: {
						innerProp1: 1
					},
					prop1: {
						innerProp1: 1
					},
					prop2: "value2"
				}
			}]);
		});

		it("writes passed data with cache when useCaching is passed", async () => {
			const time = 1234;
			Date.now = () => time;
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const settingsToSave: any = {
				prop1: {
					innerProp1: 1
				},
				prop2: "value2"
			};

			await jsonFileSettingsService.saveSettings(settingsToSave, { useCaching: true });

			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: {
						time,
						modifiedByCacheMechanism: true,
						value: {
							innerProp1: 1
						}
					},
					prop2: {
						time,
						modifiedByCacheMechanism: true,
						value: "value2"
					}
				}
			}]);
		});

		it("writes passed data with cache when useCaching is passed and does not add additional cache data to a property in case it already has such (passed directly to the method)", async () => {
			const time = 1234;
			const timeForPassedData = 123;
			Date.now = () => time;
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			const settingsToSave: any = {
				prop1: {
					time: timeForPassedData,
					modifiedByCacheMechanism: true,
					value: {
						innerProp1: 1
					}
				},
				prop2: "value2"
			};

			await jsonFileSettingsService.saveSettings(settingsToSave, { useCaching: true });

			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: {
						time: timeForPassedData,
						modifiedByCacheMechanism: true,
						value: {
							innerProp1: 1
						}
					},
					prop2: {
						time,
						modifiedByCacheMechanism: true,
						value: "value2"
					}
				}
			}]);
		});
	});

	describe("saveSetting", () => {
		it("writes passed data without cache when cache data is not passed", async () => {
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });

			await jsonFileSettingsService.saveSetting("prop1", {
				innerProp1: 1
			});

			assert.deepEqual(dataPassedToWriteJson, [{ filename: jsonFileSettingsPath, data: { prop1: { innerProp1: 1 } } }]);
		});

		it("writes passed data with cache when useCaching is passed", async () => {
			const time = 1234;
			Date.now = () => time;
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });

			await jsonFileSettingsService.saveSetting("prop1", { innerProp1: 1 }, { useCaching: true });

			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: {
						time,
						modifiedByCacheMechanism: true,
						value: {
							innerProp1: 1
						}
					}
				}
			}]);
		});

		it("writes passed data with cache when useCaching is passed and does not add additional cache data to a property in case it already has such (passed directly to the method)", async () => {
			const time = 1234;
			const timeForPassedData = 123;
			Date.now = () => time;
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });

			await jsonFileSettingsService.saveSetting("prop1", {
				time: timeForPassedData,
				modifiedByCacheMechanism: true,
				value: {
					innerProp1: 1
				}
			}, { useCaching: true });

			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: {
						time: timeForPassedData,
						modifiedByCacheMechanism: true,
						value: {
							innerProp1: 1
						}
					}
				}
			}]);
		});
	});

	describe("removeSetting", () => {
		it("removes existing property from file when fileData does not have caching information", async () => {
			dataInFile = { [jsonFileSettingsPath]: { prop1: 1, prop2: { innerProp1: 2 } } };
			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			await jsonFileSettingsService.removeSetting("prop2");
			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: 1
				}
			}]);
		});

		it("removes existing property from file when fileData does not have caching information", async () => {
			const currentTime = "12454";
			dataInFile = {
				[jsonFileSettingsPath]: {
					prop1: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: 1
					},
					prop2: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: { innerProp1: "val" }
					}
				}
			};

			const testInjector = createTestInjector();
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
			await jsonFileSettingsService.removeSetting("prop2");
			assert.deepEqual(dataPassedToWriteJson, [{
				filename: jsonFileSettingsPath,
				data: {
					prop1: {
						time: currentTime,
						modifiedByCacheMechanism: true,
						value: 1
					}
				}
			}]);
		});
	});
});
