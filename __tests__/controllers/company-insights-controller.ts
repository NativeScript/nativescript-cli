import { assert } from "chai";
import { Yok } from "../../src/common/yok";
import { LoggerStub } from "../stubs";
import { CompanyInsightsController } from "../../src/controllers/company-insights-controller";
import { IInjector } from "../../src/common/definitions/yok";
import { IProxySettings, Server } from "../../src/common/declarations";

describe("companyInsightsController", () => {
	const insightsUrlEndpoint = "/api/insights?ipAddress=%s";
	const currentIp = "8.8.8.8";
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
		injector.register("ipService", {
			getCurrentIPv4Address: async (): Promise<string> => currentIp
		});

		injector.register("companyInsightsController", CompanyInsightsController);

		return injector;
	};

	beforeEach(() => {
		httpRequestCounter = 0;
		httpRequestResult = defaultCompanyData;
		testInjector = createTestInjector();
		companyInsightsController = testInjector.resolve<ICompanyInsightsController>("companyInsightsController");
	});

	describe("getCompanyData", () => {
		describe("returns null when", () => {
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
			});
		});

		describe("returns correct data when", () => {
				it("response contains company property", async () => {
					const companyData = await companyInsightsController.getCompanyData();
					assert.deepEqual(companyData, defaultExpectedCompanyData);
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
