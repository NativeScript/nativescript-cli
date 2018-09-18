import { PreviewSdkService } from "../../lib/services/livesync/playground/preview-sdk-service";
import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { LoggerStub, ErrorsStub } from "../stubs";

const getPreviewSdkService = (): IPreviewSdkService => {
	const testInjector = new Yok();
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("config", {});
	testInjector.register("previewSdkService", PreviewSdkService);

	testInjector.register("httpClient", {
		httpRequest: async (options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> => undefined
	});

	return testInjector.resolve("previewSdkService");
};

describe('PreviewSdkService', () => {
	describe('getQrCodeUrl', () => {
		it('sets hmr to 1 when useHotModuleReload is true', async () => {
			const sdk = getPreviewSdkService();

			const previewUrl = sdk.getQrCodeUrl({ useHotModuleReload: true });

			assert.isTrue(previewUrl.indexOf("hmr=1") > -1);
		});
	});

	it('sets hmr to 0 when useHotModuleReload is false', async () => {
		const sdk = getPreviewSdkService();

		const previewUrl = sdk.getQrCodeUrl({ useHotModuleReload: false });

		assert.isTrue(previewUrl.indexOf("hmr=0") > -1);
	});
});
