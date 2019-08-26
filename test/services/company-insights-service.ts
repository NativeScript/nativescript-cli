import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { LoggerStub } from "../stubs";
import { CompanyInsightsService } from "../../lib/services/company-insights-service";

describe("companyInsightsService", () => {
	const insightsUrlEndpoint = "/api/insights";
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("config", {
			INSIGHTS_URL_ENDPOINT: insightsUrlEndpoint
		});
		testInjector.register("httpClient", {});
		testInjector.register("logger", LoggerStub);
		testInjector.register("companyInsightsService", CompanyInsightsService);
		return testInjector;
	};

	describe("getCompanyData", () => {
		describe("returns null when", () => {
			it("the http client fails to get data", async () => {
				const testInjector = createTestInjector();
				const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				const errMsg = "custom error";
				httpClient.httpRequest = async () => {
					throw new Error(errMsg);
				};

				const companyData = await companyInsightsService.getCompanyData();
				assert.isNull(companyData);
				const logger = testInjector.resolve<LoggerStub>("logger");
				assert.isTrue(logger.traceOutput.indexOf(errMsg) !== -1);
			});

			it("the body of the response is not a valid JSON", async () => {
				const testInjector = createTestInjector();
				const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				httpClient.httpRequest = async (): Promise<any> => {
					return {
						body: "invalid JSON"
					};
				};

				const companyData = await companyInsightsService.getCompanyData();
				assert.isNull(companyData);
				const logger = testInjector.resolve<LoggerStub>("logger");
				assert.isTrue(logger.traceOutput.indexOf("SyntaxError: Unexpected token") !== -1);
			});

			it("response does not contain company property", async () => {
				const httpResultData = {
					foo: "bar"
				};

				const testInjector = createTestInjector();
				const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				httpClient.httpRequest = async (): Promise<any> => {
					return {
						body: JSON.stringify(httpResultData)
					};
				};

				const companyData = await companyInsightsService.getCompanyData();
				assert.deepEqual(companyData, null);
			});
		});

		describe("returns correct data when", () => {
			it("response contains company property", async () => {
				const httpResultData = {
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

				const testInjector = createTestInjector();
				const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				httpClient.httpRequest = async (): Promise<any> => {
					return {
						body: JSON.stringify(httpResultData)
					};
				};

				const companyData = await companyInsightsService.getCompanyData();
				assert.deepEqual(companyData, {
					name: "Progress",
					country: "Bulgaria",
					revenue: "123131",
					industries: "Software__Software 2",
					employeeCount: "500"
				});
			});

			it("response contains company property and industries in it are not populated", async () => {
				const httpResultData = {
					company: {
						name: "Progress",
						country: "Bulgaria",
						revenue: "123131",
						employeeCount: "500"
					}
				};

				const testInjector = createTestInjector();
				const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
				const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
				httpClient.httpRequest = async (): Promise<any> => {
					return {
						body: JSON.stringify(httpResultData)
					};
				};

				const companyData = await companyInsightsService.getCompanyData();
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
			const httpResultData = {
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

			const testInjector = createTestInjector();
			const companyInsightsService = testInjector.resolve<ICompanyInsightsService>("companyInsightsService");
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			let httpRequestCounter = 0;
			httpClient.httpRequest = async (): Promise<any> => {
				httpRequestCounter++;
				return {
					body: JSON.stringify(httpResultData)
				};
			};

			const expectedData = {
				name: "Progress",
				country: "Bulgaria",
				revenue: "123131",
				industries: "Software__Software 2",
				employeeCount: "500"
			};
			const companyData = await companyInsightsService.getCompanyData();
			assert.deepEqual(companyData, expectedData);
			assert.equal(httpRequestCounter, 1);

			const companyDataSecondCall = await companyInsightsService.getCompanyData();
			assert.deepEqual(companyDataSecondCall, expectedData);

			assert.equal(httpRequestCounter, 1);
		});
	});
});
