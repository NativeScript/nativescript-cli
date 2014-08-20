///<reference path="../.d.ts"/>
"use strict";
import osenv = require("osenv");
import path = require("path");

export class PostInstallCommand implements ICommand {
	private static CALL_PROFILE_SCRIPT =
		"if [ -f ~/.profile ]; then\n" +
		"		. ~/.profile\n" +
		"fi\n";

	constructor(private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $logger: ILogger) { }

	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var scriptsOk = true;

			try {
				this.updateShellScript(".profile").wait();
				this.updateShellScript(".bashrc").wait();

				this.updateBashProfile().wait();

				// zsh - http://www.acm.uiuc.edu/workshops/zsh/startup_files.html
				this.updateShellScript(".zshrc").wait();
			} catch(err) {
				this.$logger.out("Failed to update all shell start-up scripts. Auto-completion may not work. " + err);
				scriptsOk = false;
			}

			if(scriptsOk) {
				this.$logger.out("Restart your shell to enable command auto-completion.");
			}
		}).future<void>()();
	}

	private updateShellScript(fileName: string): IFuture<void> {
		return (() => {
			var filePath = this.getHomePath(fileName);

			var doUpdate = true;
			if (this.$fs.exists(filePath).wait()) {
				var contents = this.$fs.readText(filePath).wait();
				if (contents.match(/nativescript\s+completion\s+--\s+/) || contents.match(/tns\s+completion\s+--\s+/)) {
					doUpdate = false;
				}
			}

			if(doUpdate) {
				this.updateShellScriptCore(filePath).wait();
			}

		}).future<void>()();
	}

	private updateShellScriptCore(filePath: string): IFuture<void> {
		return (() => {
			this.$childProcess.exec("nativescript completion >> " + filePath).wait();
			this.$childProcess.exec("tns completion >> " + filePath).wait();
		}).future<void>()();
	}

	private getHomePath(fileName: string): string {
		return path.join(osenv.home(), fileName);
	}

	private updateBashProfile(): IFuture<void> {
		return (() => {
			var bashProfileFileName = this.getHomePath(".bash_profile");
			if (this.$fs.exists(bashProfileFileName).wait()) {
				var contens = this.$fs.readText(bashProfileFileName).wait();
				if (contens.indexOf(PostInstallCommand.CALL_PROFILE_SCRIPT) < 0) {
					this.updateShellScript(".bash_profile");
				}
			} else {
				this.$fs.writeFile(bashProfileFileName, PostInstallCommand.CALL_PROFILE_SCRIPT).wait();
				this.updateShellScriptCore(bashProfileFileName).wait();
			}
		}).future<void>()();
	}
}
$injector.registerCommand("dev-post-install", PostInstallCommand);