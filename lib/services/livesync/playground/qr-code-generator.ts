import { PlaygroundStoreUrls } from "./preview-app-constants";
import * as util from "util";

export class PlaygroundQrCodeGenerator implements IPlaygroundQrCodeGenerator {
	constructor(private $previewSdkService: IPreviewSdkService,
		private $httpClient: Server.IHttpClient,
		private $qrCodeTerminalService: IQrCodeTerminalService,
		private $config: IConfiguration) {
	}

	public async generateQrCodeForiOS(): Promise<void> {
		await this.generateQrCode(PlaygroundStoreUrls.APP_STORE_URL);
	}

	public async generateQrCodeForAndroid(): Promise<void> {
		await this.generateQrCode(PlaygroundStoreUrls.GOOGLE_PLAY_URL);
	}

	public async generateQrCodeForCurrentApp(): Promise<void> {
		await this.generateQrCode(this.$previewSdkService.qrCodeUrl);
	}

	private async generateQrCode(url: string): Promise<void> {
		const shortenUrlEndpoint = util.format(this.$config.SHORTEN_URL_ENDPOINT, url);
		try {
			const response = await this.$httpClient.httpRequest(shortenUrlEndpoint);
			const responseBody = JSON.parse(response.body);
			url = responseBody.shortURL || url;
		} catch (e) {
			// use the longUrl
		}

		this.$qrCodeTerminalService.generate(url);
	}
}
$injector.register("playgroundQrCodeGenerator", PlaygroundQrCodeGenerator);
