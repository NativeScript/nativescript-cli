import { PreviewSdkService } from "../../lib/services/livesync/playground/preview-sdk-service";
import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { LoggerStub } from "../stubs";
import { PubnubKeys } from "../../lib/services/livesync/playground/preview-app-constants";

const getPreviewSdkService = (): IPreviewSdkService => {
	const testInjector = new Yok();
	testInjector.register("logger", LoggerStub);
	testInjector.register("config", {});
	testInjector.register("previewSdkService", PreviewSdkService);
	testInjector.register("previewDevicesService", {});
	testInjector.register("previewAppLogProvider", {});
	testInjector.register("httpClient", {
		httpRequest: async (options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> => undefined
	});

	return testInjector.resolve("previewSdkService");
};

describe('PreviewSdkService', () => {
	describe('getQrCodeUrl', () => {
		describe("hmr", () => {
			it('sets hmr to 1 when useHotModuleReload is true', async () => {
				const sdk = getPreviewSdkService();

				const previewUrl = sdk.getQrCodeUrl({ useHotModuleReload: true });

				assert.isTrue(previewUrl.indexOf("hmr=1") > -1);
			});
			it('sets hmr to 0 when useHotModuleReload is false', async () => {
				const sdk = getPreviewSdkService();

				const previewUrl = sdk.getQrCodeUrl({ useHotModuleReload: false });

				assert.isTrue(previewUrl.indexOf("hmr=0") > -1);
			});
		});

		describe("schema", () => {
			const testCases: [{ name: string, schemaFromApi: string, schemaFromNsConfig: string, expectedSchemaName: string }] = [
				{
					name: "should return the schema from api",
					schemaFromApi: "ksplay",
					schemaFromNsConfig: null,
					expectedSchemaName: "ksplay"
				},
				{
					name: "should return the schema from nsconfig",
					schemaFromApi: null,
					schemaFromNsConfig: "ksplay",
					expectedSchemaName: "ksplay"
				},
				{
					name: "should return the default schema",
					schemaFromApi: null,
					schemaFromNsConfig: null,
					expectedSchemaName: "nsplay"
				}
			];

			_.each(testCases, testCase => {
				it(`${testCase.name}`, () => {
					const qrCodeData = { schemaName: testCase.schemaFromApi };
					const qrCodeOptions = { nsConfigPreviewAppSchema: testCase.schemaFromNsConfig, qrCodeData, useHotModuleReload: true };
					const previewSdkService = getPreviewSdkService();

					const qrCodeUrl = previewSdkService.getQrCodeUrl(qrCodeOptions);

					assert.deepEqual(qrCodeUrl.split(":")[0], testCase.expectedSchemaName);
				});
			});
		});

		describe("publishKey", () => {
			const testCases = [
				{
					name: "should return the provided key from api",
					publishKeyFromApi: "myTestPublishKey",
					expectedPublishKey: "myTestPublishKey"
				},
				{
					name: "should return the default key",
					publishKeyFromApi: null,
					expectedPublishKey: PubnubKeys.PUBLISH_KEY
				}
			];

			_.each(testCases, testCase => {
				it(`${testCase.name}`, () => {
					const qrCodeOptions = { projectData: <any>{}, qrCodeData: <any>{ publishKey: testCase.publishKeyFromApi }, useHotModuleReload: true };
					const previewSdkService = getPreviewSdkService();

					const qrCodeUrl = previewSdkService.getQrCodeUrl(qrCodeOptions);

					assert.isTrue(qrCodeUrl.indexOf(`&pKey=${testCase.expectedPublishKey}`) > -1);
				});
			});
		});

		describe("subscribeKey", () => {
			const testCases = [
				{
					name: "should return the provided key from api",
					subscribeKeyFromApi: "myTestSubscribeKey",
					expectedSubscribeKey: "myTestSubscribeKey"
				},
				{
					name: "should return the default key",
					subscribeKeyFromApi: null,
					expectedSubscribeKey: PubnubKeys.SUBSCRIBE_KEY
				}
			];

			_.each(testCases, testCase => {
				it(`${testCase.name}`, () => {
					const qrCodeOptions = { projectData: <any>{}, qrCodeData: <any>{ subscribeKey: testCase.subscribeKeyFromApi }, useHotModuleReload: true };
					const previewSdkService = getPreviewSdkService();

					const qrCodeUrl = previewSdkService.getQrCodeUrl(qrCodeOptions);

					assert.isTrue(qrCodeUrl.indexOf(`&sKey=${testCase.expectedSubscribeKey}`) > -1);
				});
			});
		});
	});
});
