const qrcode = require("qrcode-terminal");

export class QrCodeTerminalService implements IQrCodeTerminalService {
	constructor(private $logger: ILogger) { }

	public generate(url: string): void {
		this.$logger.info(`Generating qrcode for url ${url}.`);

		try {
			qrcode.generate(url);
		} catch(err) {
			this.$logger.trace(`Failed to generate QR code for ${url}`, err);
		}
	}
}
$injector.register("qrCodeTerminalService", QrCodeTerminalService);