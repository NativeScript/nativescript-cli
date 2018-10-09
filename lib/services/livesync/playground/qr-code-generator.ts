import * as util from "util";
import { EOL } from "os";
import { PlaygroundStoreUrls } from "./preview-app-constants";

export class PlaygroundQrCodeGenerator implements IPlaygroundQrCodeGenerator {
	constructor(private $previewSdkService: IPreviewSdkService,
		private $httpClient: Server.IHttpClient,
		private $qrCodeTerminalService: IQrCodeTerminalService,
		private $config: IConfiguration,
		private $logger: ILogger) {
	}

	public async generateQrCode(options: IGenerateQrCodeOptions): Promise<void> {
		let url = this.$previewSdkService.getQrCodeUrl(options);
		const shortenUrlEndpoint = util.format(this.$config.SHORTEN_URL_ENDPOINT, encodeURIComponent(url));
		try {
			const response = await this.$httpClient.httpRequest(shortenUrlEndpoint);
			const responseBody = JSON.parse(response.body);
			url = responseBody.shortURL || url;
		} catch (e) {
			// use the longUrl
		}

		this.$logger.info();
		const message = `${EOL} Generating qrcode for url ${url}.`;
		this.$logger.trace(message);

		if (options.link) {
			this.$logger.printMarkdown(message);
		} else {
			this.$qrCodeTerminalService.generate(url);

			this.$logger.info();
			this.$logger.printMarkdown(`# Use \`NativeScript Playground app\` and scan the \`QR code\` above to preview the application on your device.`);
			this.$logger.printMarkdown(`
To scan the QR code and deploy your app on a device, you need to have the \`NativeScript Playground app\`:
	App Store (iOS): ${PlaygroundStoreUrls.APP_STORE_URL}
	Google Play (Android): ${PlaygroundStoreUrls.GOOGLE_PLAY_URL}`);
		}
	}
}
$injector.register("playgroundQrCodeGenerator", PlaygroundQrCodeGenerator);
