// import { PreviewSdkService } from "../../lib/services/livesync/playground/preview-sdk-service";
// import { Yok } from "../../lib/common/yok";
// import { assert } from "chai";
// import * as _ from "lodash";
// import { LoggerStub } from "../stubs";
// import { PreviewSchemaService } from "../../lib/services/livesync/playground/preview-schema-service";
// import { IInjector } from "../../lib/common/definitions/yok";
// import { IProxySettings, Server } from "../../lib/common/declarations";

// const createTestInjector = (): IInjector => {
// 	const testInjector = new Yok();
// 	testInjector.register("logger", LoggerStub);
// 	testInjector.register("config", {});
// 	testInjector.register("previewSdkService", PreviewSdkService);
// 	testInjector.register("previewDevicesService", {});
// 	testInjector.register("previewSchemaService", PreviewSchemaService);
// 	testInjector.register("previewAppLogProvider", {});
// 	testInjector.register("httpClient", {
// 		httpRequest: async (
// 			options: any,
// 			proxySettings?: IProxySettings
// 		): Promise<Server.IResponse> => undefined,
// 	});
// 	testInjector.register("projectDataService", {
// 		getProjectData: () => ({}),
// 	});
// 	testInjector.register("errors", {});

// 	return testInjector;
// };

// describe("PreviewSdkService", () => {
// 	let injector: IInjector, previewSdkService: IPreviewSdkService;

// 	beforeEach(() => {
// 		injector = createTestInjector();
// 		previewSdkService = injector.resolve("previewSdkService");
// 	});

// 	describe("getQrCodeUrl", () => {
// 		describe("hmr", () => {
// 			it("sets hmr to 1 when useHotModuleReload is true", async () => {
// 				const previewUrl = previewSdkService.getQrCodeUrl({
// 					projectDir: "",
// 					useHotModuleReload: true,
// 				});

// 				assert.isTrue(previewUrl.indexOf("hmr=1") > -1);
// 			});
// 			it("sets hmr to 0 when useHotModuleReload is false", async () => {
// 				const previewUrl = previewSdkService.getQrCodeUrl({
// 					projectDir: "",
// 					useHotModuleReload: false,
// 				});

// 				assert.isTrue(previewUrl.indexOf("hmr=0") > -1);
// 			});
// 		});

// 		describe("schema", () => {
// 			const testCases = [
// 				{
// 					name: "should return the schema from api",
// 					schemaFromNsConfig: "nsplay",
// 					expectedSchemaName: "nsplay",
// 				},
// 				{
// 					name: "should return the schema from nsconfig",
// 					schemaFromNsConfig: "kspreview",
// 					expectedSchemaName: "kspreview",
// 				},
// 				{
// 					name: "should return the default schema",
// 					schemaFromNsConfig: null,
// 					expectedSchemaName: "nsplay",
// 				},
// 			];

// 			_.each(testCases, (testCase) => {
// 				it(`${testCase.name}`, () => {
// 					const qrCodeOptions = {
// 						projectDir: "myTestDir",
// 						useHotModuleReload: true,
// 					};
// 					const projectDataService = injector.resolve("projectDataService");
// 					projectDataService.getProjectData = () => ({
// 						previewAppSchema: testCase.schemaFromNsConfig,
// 					});

// 					const qrCodeUrl = previewSdkService.getQrCodeUrl(qrCodeOptions);

// 					assert.deepStrictEqual(
// 						qrCodeUrl.split(":")[0],
// 						testCase.expectedSchemaName
// 					);
// 				});
// 			});
// 		});
// 	});
// });
