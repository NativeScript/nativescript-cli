import * as readline from "readline";
import { ReadStream } from "tty";
import * as helpers from "../common/helpers";

export class PreviewCommandHelper implements IPreviewCommandHelper {
	private ctrlcReader: readline.ReadLine;

	constructor(private $playgroundQrCodeGenerator: IPlaygroundQrCodeGenerator,
		private $processService: IProcessService) {
			this.$processService.attachToProcessExitSignals(this, () => {
				this.stopWaitingForCommand();
			});
		}

	public run() {
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
				return;
			case "i":
				await this.$playgroundQrCodeGenerator.generateQrCodeForiOS();
				return;
			case "c":
				await this.$playgroundQrCodeGenerator.generateQrCodeForCurrentApp();
				return;
		}
	}

	private closeCtrlcReader() {
		if (this.ctrlcReader) {
			this.ctrlcReader.close();
		}
	}
}
$injector.register("previewCommandHelper", PreviewCommandHelper);
