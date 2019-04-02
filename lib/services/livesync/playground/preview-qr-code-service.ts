import * as util from "util";
import { EOL } from "os";
import { exported } from "../../../common/decorators";

export class PreviewQrCodeService implements IPreviewQrCodeService {
	constructor(
		private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $previewSdkService: IPreviewSdkService,
		private $previewSchemaService: IPreviewSchemaService,
		private $qrCodeTerminalService: IQrCodeTerminalService,
		private $qr: IQrCodeGenerator
	) { }

	@exported("previewQrCodeService")
	public async getPlaygroundAppQrCode(options?: IPlaygroundAppQrCodeOptions): Promise<IDictionary<IQrCodeImageData>> {
		const { projectDir } = options;
		const result = Object.create(null);

		if (!options || !options.platform || this.$mobileHelper.isAndroidPlatform(options.platform)) {
			result.android = await this.getLiveSyncQrCode(this.getGooglePlayUrl(projectDir));
		}

		if (!options || !options.platform || this.$mobileHelper.isiOSPlatform(options.platform)) {
			result.ios = await this.getLiveSyncQrCode(this.getAppStoreUrl(projectDir));
		}

		return result;
	}

	public async getLiveSyncQrCode(url: string): Promise<IQrCodeImageData> {
		const shortenUrl = await this.getShortenUrl(url);
		const imageData = await this.$qr.generateDataUri(shortenUrl);
		return {
			originalUrl: url,
			shortenUrl,
			imageData
		};
	}

	public async printLiveSyncQrCode(options: IPrintLiveSyncOptions): Promise<void> {
		const qrCodeUrl = this.$previewSdkService.getQrCodeUrl(options);
		const url = await this.getShortenUrl(qrCodeUrl);

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
	App Store (iOS): ${this.getAppStoreUrl(options.projectDir)}
	Google Play (Android): ${this.getGooglePlayUrl(options.projectDir)}`);
		}
	}

	private async getShortenUrl(url: string): Promise<string> {
		const shortenUrlEndpoint = util.format(this.$config.SHORTEN_URL_ENDPOINT, encodeURIComponent(url));
		try {
			const response = await this.$httpClient.httpRequest(shortenUrlEndpoint);
			const responseBody = JSON.parse(response.body);
			url = responseBody.shortURL || url;
		} catch (e) {
			// use the longUrl
		}

		return url;
	}

	private getGooglePlayUrl(projectDir: string): string {
		const schema = this.$previewSchemaService.getSchemaData(projectDir);
		return `https://play.google.com/store/apps/details?id=${schema.scannerAppId}`;
	}

	private getAppStoreUrl(projectDir: string): string {
		const schema = this.$previewSchemaService.getSchemaData(projectDir);
		return `https://itunes.apple.com/us/app/nativescript-playground/id${schema.scannerAppStoreId}?mt=8&ls=1`;
	}
}
$injector.register("previewQrCodeService", PreviewQrCodeService);
