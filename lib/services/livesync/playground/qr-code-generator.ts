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
		await this.generateQrCode(PlaygroundStoreUrls.APP_STORE_URL);
	}

	public async generateQrCodeForAndroid(): Promise<void> {
		await this.generateQrCode(PlaygroundStoreUrls.GOOGLE_PLAY_URL);
	}

	public async generateQrCodeForCurrentApp(): Promise<void> {
		await this.generateQrCode(this.$previewSdkService.qrCodeUrl);
	}

	private async generateQrCode(url: string): Promise<void> {
		await this.generateQrCodeCore(url);
		this.printUsage();
	}

	private async generateQrCodeCore(url: string): Promise<void> {
		const shortenUrlEndpoint = util.format(this.$config.SHORTEN_URL_ENDPOINT, encodeURIComponent(url));
		try {
			const response = await this.$httpClient.httpRequest(shortenUrlEndpoint);
			const responseBody = JSON.parse(response.body);
			url = responseBody.shortURL || url;
		} catch (e) {
			// use the longUrl
		}

		this.$qrCodeTerminalService.generate(url);
	}

	private printUsage(): void {
		this.$logger.info(`
-> Press ${this.underlineBoldCyan("a")} to show the QR code of NativeScript Playground app for ${this.underlineBoldCyan("Android")} devices
-> Press ${this.underlineBoldCyan("i")} to show the QR code of NativeScript Playground app for ${this.underlineBoldCyan("iOS")} devices
-> Press ${this.underlineBoldCyan("c")} to display the QR code of the ${this.underlineBoldCyan("current application")}.
		`);
	}

	private underlineBoldCyan(str: string) {
		const { bold, underline, cyan } = chalk;
		return underline(bold(cyan(str)));
	}
}
$injector.register("playgroundQrCodeGenerator", PlaygroundQrCodeGenerator);
