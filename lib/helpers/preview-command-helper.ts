import * as readline from "readline";
import { ReadStream } from "tty";
import * as helpers from "../common/helpers";
const chalk = require("chalk");

export class PreviewCommandHelper implements IPreviewCommandHelper {
	private ctrlcReader: readline.ReadLine;

	constructor(private $logger: ILogger,
		private $playgroundQrCodeGenerator: IPlaygroundQrCodeGenerator,
		private $processService: IProcessService) {
			this.$processService.attachToProcessExitSignals(this, () => {
				this.stopWaitingForCommand();
			});
		}

	public run() {
		this.printUsage();
		this.startWaitingForCommand();
	}

	private startWaitingForCommand(): void {
		if (helpers.isInteractive()) {
			this.ctrlcReader = readline.createInterface(<any>{
				input: process.stdin,
				output: process.stdout
			});
			this.ctrlcReader.on("SIGINT", process.exit);

			(<ReadStream>process.stdin).setRawMode(true);
			process.stdin.resume();
			process.stdin.setEncoding("utf8");
			process.stdin.on("data", this.handleKeypress.bind(this));
		}
	}

	private stopWaitingForCommand(): void {
		if (helpers.isInteractive()) {
			process.stdin.removeListener("data", this.handleKeypress);
			(<ReadStream>process.stdin).setRawMode(false);
			process.stdin.resume();
			this.closeCtrlcReader();
		}
	}

	private async handleKeypress(key: string): Promise<void> {
		switch (key) {
			case "a":
				await this.$playgroundQrCodeGenerator.generateQrCodeForAndroid();
				this.printUsage();
				return;
			case "i":
				await this.$playgroundQrCodeGenerator.generateQrCodeForiOS();
				this.printUsage();
				return;
			case "c":
				await this.$playgroundQrCodeGenerator.generateQrCodeForCurrentApp();
				this.printUsage();
				return;
		}
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

	private closeCtrlcReader() {
		if (this.ctrlcReader) {
			this.ctrlcReader.close();
		}
	}
}
$injector.register("previewCommandHelper", PreviewCommandHelper);
