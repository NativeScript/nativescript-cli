import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { LoggerStub } from "../stubs";
import { CompanyInsightsController } from "../../lib/controllers/company-insights-controller";

describe("companyInsightsController", () => {
	const insightsUrlEndpoint = "/api/insights?ipAddress=%s";
	const currentIp = "8.8.8.8";
	const profileDir = "profileDir";
	const cacheTimeout = 30 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
	const defaultCompanyData = {
		company: {
			name: "Progress",
			country: "Bulgaria",
			revenue: "123131",
			industries: [
				"Software",
				"Software 2"
			],
			employeeCount: "500"
		}
	};

	const defaultExpectedCompanyData: ICompanyData = {
		name: "Progress",
		country: "Bulgaria",
		revenue: "123131",
		industries: "Software__Software 2",
		employeeCount: "500"
	};

	const defaultExpectedDataPassedToGetSetting: any[] = [{ settingName: `companyInformation_${currentIp}`, cacheOpts: { cacheTimeout } }];
	const defaultExpectedDataPassedToSaveSetting: any[] = [
		{
			cacheOpts: {
				useCaching: true
			},
			key: "companyInformation_8.8.8.8",
			value: {
				country: "Bulgaria",
				employeeCount: "500",
				industries: "Software__Software 2",
				name: "Progress",
				revenue: "123131"
			}
		}
	];

	let dataPassedToGetSettingValue: { settingName: string, cacheOpts?: ICacheTimeoutOpts }[] = [];
	let dataPassedToSaveSettingValue: { key: string, value: any, cacheOpts?: IUseCacheOpts }[] = [];
	let getSettingValueResult: IDictionary<any> = null;
	let httpRequestCounter = 0;
	let httpRequestResult: any = null;
	let testInjector: IInjector = null;
	let companyInsightsController: ICompanyInsightsController = null;

	const createTestInjector = (): IInjector => {
		const injector = new Yok();
		injector.register("config", {
			INSIGHTS_URL_ENDPOINT: insightsUrlEndpoint
		});

		injector.register("httpClient", {
			httpRequest: async (options: any, proxySettings?: IProxySettings): Promise<any> => {
				httpRequestCounter++;
				return { body: JSON.stringify(httpRequestResult) };
			}
		});

		injector.register("logger", LoggerStub);
		injector.register("injector", injector);
		injector.register("ipService", {
			getCurrentIPv4Address: async (): Promise<string> => currentIp
		});

		injector.register("settingsService", {
			getProfileDir: (): string => profileDir
		});

		injector.register("jsonFileSettingsService", {
			getSettingValue: async (settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<any> => {
				dataPassedToGetSettingValue.push({ settingName, cacheOpts });
				return getSettingValueResult;
			},

			saveSetting: async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => {
				dataPassedToSaveSettingValue.push({ key, value, cacheOpts });
			}
		});

		injector.register("companyInsightsController", CompanyInsightsController);

		return injector;
	};

	beforeEach(() => {
		dataPassedToGetSettingValue = [];
		dataPassedToSaveSettingValue = [];
		getSettingValueResult = null;
		httpRequestCounter = 0;
		httpRequestResult = defaultCompanyData;
		testInjector = createTestInjector();
		companyInsightsController = testInjector.resolve<ICompanyInsightsController>("companyInsightsController");
	});

	describe("getCompanyData", () => {
		describe("returns null when data does not exist in the cache and", () => {
			it("the http client fails to get data", async () => {
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				const errMsg = "custom error";
				httpClient.httpRequest = async () => {
					throw new Error(errMsg);
				};

				const companyData = await companyInsightsController.getCompanyData();
				assert.isNull(companyData);
				const logger = testInjector.resolve<LoggerStub>("logger");
				assert.isTrue(logger.traceOutput.indexOf(errMsg) !== -1);
			});

			it("the body of the response is not a valid JSON", async () => {
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				httpClient.httpRequest = async (): Promise<any> => {
					return { body: "invalid JSON" };
				};

				const companyData = await companyInsightsController.getCompanyData();
				assert.isNull(companyData);
				const logger = testInjector.resolve<LoggerStub>("logger");
				assert.isTrue(logger.traceOutput.indexOf("SyntaxError: Unexpected token") !== -1);
			});

			it("response does not contain company property", async () => {
				httpRequestResult = {
					foo: "bar"
				};

				const companyData = await companyInsightsController.getCompanyData();
				assert.deepEqual(companyData, null);
			});

			it("unable to get current ip address", async () => {
				const ipService = testInjector.resolve<IIPService>("ipService");
				ipService.getCurrentIPv4Address = async (): Promise<string> => { throw new Error("Unable to get current ip addreess"); };

				const companyData = await companyInsightsController.getCompanyData();
				assert.deepEqual(companyData, null);
				assert.equal(httpRequestCounter, 0, "We should not have any http request");
				assert.deepEqual(dataPassedToGetSettingValue, [], "When we are unable to get IP, we should not try to get value from the cache.");
				assert.deepEqual(dataPassedToSaveSettingValue, [], "When we are unable to get IP, we should not persist anything.");
			});
		});

		describe("returns correct data when", () => {
			it("data for current ip exist in the cache", async () => {
				httpRequestResult = null;

				getSettingValueResult = defaultExpectedCompanyData; // data in the file should be in the already parsed format
				const companyData = await companyInsightsController.getCompanyData();
				assert.deepEqual(companyData, defaultExpectedCompanyData);

				assert.equal(httpRequestCounter, 0, "In case we have data for the company in our cache, we should not make any http requests");
				assert.deepEqual(dataPassedToGetSettingValue, defaultExpectedDataPassedToGetSetting);
				assert.deepEqual(dataPassedToSaveSettingValue, []);
			});

			describe("data for current ip does not exist in the cache and", () => {

				it("response contains company property", async () => {
					const companyData = await companyInsightsController.getCompanyData();
					assert.deepEqual(companyData, defaultExpectedCompanyData);
					assert.deepEqual(dataPassedToGetSettingValue, defaultExpectedDataPassedToGetSetting);
					assert.deepEqual(dataPassedToSaveSettingValue, defaultExpectedDataPassedToSaveSetting);
				});

				it("response contains company property and industries in it are not populated", async () => {
					httpRequestResult = {
						company: {
							name: "Progress",
							country: "Bulgaria",
							revenue: "123131",
							employeeCount: "500"
						}
					};

					const companyData = await companyInsightsController.getCompanyData();
					assert.deepEqual(companyData, {
						name: "Progress",
						country: "Bulgaria",
						revenue: "123131",
						industries: null,
						employeeCount: "500"
					});

					assert.deepEqual(dataPassedToGetSettingValue, defaultExpectedDataPassedToGetSetting);
					assert.deepEqual(dataPassedToSaveSettingValue, [
						{
							cacheOpts: {
								useCaching: true
							},
							key: "companyInformation_8.8.8.8",
							value: {
								country: "Bulgaria",
								employeeCount: "500",
								industries: null,
								name: "Progress",
								revenue: "123131"
							}
						}
					]);
				});

			});
		});

		it("is called only once per process", async () => {
			const companyData = await companyInsightsController.getCompanyData();
			assert.deepEqual(companyData, defaultExpectedCompanyData);
			assert.equal(httpRequestCounter, 1);

			const companyDataSecondCall = await companyInsightsController.getCompanyData();
			assert.deepEqual(companyDataSecondCall, defaultExpectedCompanyData);
			assert.equal(httpRequestCounter, 1);
		});
	});
});
