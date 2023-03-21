import { Yok } from "../../lib/common/yok";
import { LoggerStub } from "../stubs";
import { IPService } from "../../lib/services/ip-service";
import { assert } from "chai";
import { IProxySettings, Server } from "../../lib/common/declarations";
import { IInjector } from "../../lib/common/definitions/yok";

describe("ipService", () => {
	const ip = "8.8.8.8";
	const errMsgForMyipCom = "Unable to get data from myip.com";
	const errMsgForIpifyOrg = "Unable to get data from ipify.org";

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("httpClient", {
			httpRequest: async (
				options: any,
				proxySettings?: IProxySettings
			): Promise<Server.IResponse> => <any>{},
		});

		testInjector.register("logger", LoggerStub);
		testInjector.register("ipService", IPService);
		return testInjector;
	};

	describe("getCurrentIPv4Address", () => {
		it("returns result from default service (myip.com) when it succeeds", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			const httpRequestPassedOptions: any[] = [];
			httpClient.httpRequest = async (
				options: any,
				proxySettings?: IProxySettings
			): Promise<Server.IResponse> => {
				httpRequestPassedOptions.push(options);
				return <any>{ body: JSON.stringify({ ip }) };
			};

			const ipService = testInjector.resolve<IIPService>("ipService");
			const ipAddress = await ipService.getCurrentIPv4Address();

			assert.equal(ipAddress, ip);
			assert.deepStrictEqual(httpRequestPassedOptions, [
				{ method: "GET", url: "https://api.myip.com", timeout: 1000 },
			]);
		});

		it("returns result from ipify.com when the default endpoint (myip.com) fails", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			const httpRequestPassedOptions: any[] = [];
			httpClient.httpRequest = async (
				options: any,
				proxySettings?: IProxySettings
			): Promise<Server.IResponse> => {
				httpRequestPassedOptions.push(options);
				if (options.url === "https://api.myip.com") {
					throw new Error(errMsgForMyipCom);
				}

				return <any>{ body: ip };
			};

			const ipService = testInjector.resolve<IIPService>("ipService");
			const ipAddress = await ipService.getCurrentIPv4Address();

			assert.equal(ipAddress, ip);
			assert.deepStrictEqual(httpRequestPassedOptions, [
				{ method: "GET", url: "https://api.myip.com", timeout: 1000 },
				{ method: "GET", url: "https://api.ipify.org", timeout: 1000 },
			]);

			const logger = testInjector.resolve<LoggerStub>("logger");
			assert.isTrue(
				logger.traceOutput.indexOf(errMsgForMyipCom) !== -1,
				`Trace output\n'${logger.traceOutput}'\ndoes not contain expected message:\n${errMsgForMyipCom}`
			);
		});

		it("returns null when all endpoints fail", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			const httpRequestPassedOptions: any[] = [];
			httpClient.httpRequest = async (
				options: any,
				proxySettings?: IProxySettings
			): Promise<Server.IResponse> => {
				httpRequestPassedOptions.push(options);
				if (options.url === "https://api.myip.com") {
					throw new Error(errMsgForMyipCom);
				}

				if (options.url === "https://api.ipify.org") {
					throw new Error(errMsgForIpifyOrg);
				}

				return <any>{ body: ip };
			};

			const ipService = testInjector.resolve<IIPService>("ipService");
			const ipAddress = await ipService.getCurrentIPv4Address();

			assert.isNull(ipAddress);
			assert.deepStrictEqual(httpRequestPassedOptions, [
				{ method: "GET", url: "https://api.myip.com", timeout: 1000 },
				{ method: "GET", url: "https://api.ipify.org", timeout: 1000 },
			]);

			const logger = testInjector.resolve<LoggerStub>("logger");
			assert.isTrue(
				logger.traceOutput.indexOf(errMsgForMyipCom) !== -1,
				`Trace output\n'${logger.traceOutput}'\ndoes not contain expected message:\n${errMsgForMyipCom}`
			);
			assert.isTrue(
				logger.traceOutput.indexOf(errMsgForIpifyOrg) !== -1,
				`Trace output\n'${logger.traceOutput}'\ndoes not contain expected message:\n${errMsgForMyipCom}`
			);
		});

		it("is called only once per process", async () => {
			const testInjector = createTestInjector();
			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			let httpRequestCounter = 0;
			httpClient.httpRequest = async (
				options: any,
				proxySettings?: IProxySettings
			): Promise<Server.IResponse> => {
				httpRequestCounter++;
				return <any>{ body: JSON.stringify({ ip }) };
			};

			const ipService = testInjector.resolve<IIPService>("ipService");

			const ipAddress = await ipService.getCurrentIPv4Address();
			assert.equal(httpRequestCounter, 1);
			assert.equal(ipAddress, ip);

			const ipAddress2 = await ipService.getCurrentIPv4Address();
			assert.equal(httpRequestCounter, 1);
			assert.equal(ipAddress2, ip);
		});
	});
});
