import { PlaygroundStoreUrls } from "./preview-app-constants";

export class PlaygroundQrCodeGenerator implements IPlaygroundQrCodeGenerator {
	constructor(private $previewSdkService: IPreviewSdkService,
		private $qrCodeTerminalService: IQrCodeTerminalService) { }

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
		// TODO: Shorten url before generate QR code
		this.$qrCodeTerminalService.generate(url);
	}
}
$injector.register("playgroundQrCodeGenerator", PlaygroundQrCodeGenerator);
