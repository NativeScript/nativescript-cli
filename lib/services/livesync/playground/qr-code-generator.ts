import { PlaygroundStoreUrls } from "./preview-app-constants";
import * as util from "util";
const chalk = require("chalk");

export class PlaygroundQrCodeGenerator implements IPlaygroundQrCodeGenerator {
	constructor(private $previewSdkService: IPreviewSdkService,
		private $httpClient: Server.IHttpClient,
		private $qrCodeTerminalService: IQrCodeTerminalService,
		private $config: IConfiguration,
		private $logger: ILogger) {
	}

	public async generateQrCodeForiOS(): Promise<void> {
		const message = `Scan the QR code below to install ${"NativeScript Playground app".underline.bold} on your ${"iOS".underline.bold} device or get it from ${PlaygroundStoreUrls.APP_STORE_URL.underline.bold}.`;
		await this.generateQrCode(PlaygroundStoreUrls.APP_STORE_URL, message);
	}

	public async generateQrCodeForAndroid(): Promise<void> {
		const message = `Scan the QR code below to install ${"NativeScript Playground app".underline.bold} on your ${"Android".underline.bold} device or get it from ${PlaygroundStoreUrls.GOOGLE_PLAY_URL.underline.bold}.`;
		await this.generateQrCode(PlaygroundStoreUrls.GOOGLE_PLAY_URL, message);
	}

	public async generateQrCodeForCurrentApp(options: IHasUseHotModuleReloadOption): Promise<void> {
		const message = `Use ${"NativeScript Playground app".underline.bold} and scan the QR code below to preview the application on your device.`;
		await this.generateQrCode(this.$previewSdkService.getQrCodeUrl(options), message);
	}

	private async generateQrCode(url: string, message: string): Promise<void> {
		await this.generateQrCodeCore(url, message);
		this.printUsage();
	}

	private async generateQrCodeCore(url: string, message: string): Promise<void> {
		const shortenUrlEndpoint = util.format(this.$config.SHORTEN_URL_ENDPOINT, encodeURIComponent(url));
		try {
			const response = await this.$httpClient.httpRequest(shortenUrlEndpoint);
			const responseBody = JSON.parse(response.body);
			url = responseBody.shortURL || url;
		} catch (e) {
			// use the longUrl
		}

		this.$qrCodeTerminalService.generate(url, message);
	}

	private printUsage(): void {
		this.$logger.info(`
-> Press ${this.underlineBoldCyan("a")} to get a link to NativeScript Playground app for ${this.underlineBoldCyan("Android")}
-> Press ${this.underlineBoldCyan("i")} to get a link to NativeScript Playground app for ${this.underlineBoldCyan("iOS")}
-> Press ${this.underlineBoldCyan("c")} to show the QR code of the ${this.underlineBoldCyan("current application")}.
		`);
	}

	private underlineBoldCyan(str: string) {
		const { bold, underline, cyan } = chalk;
		return underline(bold(cyan(str)));
	}
}
$injector.register("playgroundQrCodeGenerator", PlaygroundQrCodeGenerator);
