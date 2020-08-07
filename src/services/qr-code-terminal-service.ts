const qrcode = require("qrcode-terminal");

export class QrCodeTerminalService implements IQrCodeTerminalService {
	constructor(private $logger: ILogger) { }

	public generate(url: string): void {
		try {
			qrcode.generate(url);
		} catch (err) {
			this.$logger.info(`Failed to generate QR code for ${url}`, err);
		}
	}
}
$injector.register("qrCodeTerminalService", QrCodeTerminalService);
