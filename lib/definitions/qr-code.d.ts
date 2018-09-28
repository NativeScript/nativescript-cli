interface IQrCodeTerminalService {
	generate(url: string, message: string): void;
}