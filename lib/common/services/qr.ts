import { imageSync } from "qr-image";
import { escape } from "querystring";

export class QrCodeGenerator implements IQrCodeGenerator {
	constructor(private $staticConfig: Config.IStaticConfig,
		private $logger: ILogger) { }

	public async generateDataUri(data: string): Promise<string> {
		let result: string = null;
		try {
			const qrSvg = imageSync(data, { size: this.$staticConfig.QR_SIZE, type: "svg" }).toString();
			result = `data:image/svg+xml;utf-8,${escape(qrSvg)}`;
		} catch (err) {
			this.$logger.trace(`Failed to generate QR code for ${data}`, err);
		}

		return result;
	}
}

$injector.register("qr", QrCodeGenerator);
