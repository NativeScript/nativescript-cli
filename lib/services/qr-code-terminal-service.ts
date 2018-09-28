import { EOL } from "os";

const qrcode = require("qrcode-terminal");

export class QrCodeTerminalService implements IQrCodeTerminalService {
	constructor(private $logger: ILogger) { }

	public generate(url: string, message: string): void {
		this.$logger.info(`${EOL} ${message.blue}`);
		this.$logger.info(`${EOL} Generating qrcode for url ${url}.`);

		try {
			qrcode.generate(url);
		} catch (err) {
			this.$logger.info(`Failed to generate QR code for ${url}`, err);
		}
	}
}
$injector.register("qrCodeTerminalService", QrCodeTerminalService);
