import { homedir } from "os";
import * as path from "path";
import * as util from "util";
import * as _ from "lodash";
import { cache } from "../decorators";
import {
	IAutoCompletionService,
	IFileSystem,
	IChildProcess,
	IHostInfo,
} from "../declarations";
import { injector } from "../yok";

export class AutoCompletionService implements IAutoCompletionService {
	private scriptsOk = true;
	private scriptsUpdated = false;
	private static COMPLETION_START_COMMENT_PATTERN =
		"###-%s-completion-start-###";
	private static COMPLETION_END_COMMENT_PATTERN = "###-%s-completion-end-###";
	private static TABTAB_COMPLETION_START_REGEX_PATTERN =
		"###-begin-%s-completion-###";
	private static TABTAB_COMPLETION_END_REGEX_PATTERN =
		"###-end-%s-completion-###";
	private static GENERATED_TABTAB_COMPLETION_END =
		"###-end-ns-completions-section-###";
	private static GENERATED_TABTAB_COMPLETION_START =
		"###-begin-ns-completions-section-###";

	constructor(
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $staticConfig: Config.IStaticConfig,
		private $hostInfo: IHostInfo
	) {}

	public disableAnalytics = true;

	@cache()
	private get shellProfiles(): string[] {
		return [
			this.getHomePath(".bashrc"),
			this.getHomePath(".zshrc"), // zsh - http://www.acm.uiuc.edu/workshops/zsh/startup_files.html
		];
	}

	@cache()
	private get cliRunCommandsFile(): string {
		let cliRunCommandsFile = this.getHomePath(
			util.format(".%src", this.$staticConfig.CLIENT_NAME.toLowerCase())
		);
		if (this.$hostInfo.isWindows) {
			// on Windows bash, file is incorrectly written as C:\Users\<username>, which leads to errors when trying to execute the script:
			// $ source ~/.bashrc
			// sh.exe": C:Usersusername.appbuilderrc: No such file or directory
			cliRunCommandsFile = cliRunCommandsFile.replace(/\\/g, "/");
		}

		return cliRunCommandsFile;
	}

	private getTabTabObsoleteRegex(clientName: string): RegExp {
		const tabTabStartPoint = util.format(
			AutoCompletionService.TABTAB_COMPLETION_START_REGEX_PATTERN,
			clientName.toLowerCase()
		);
		const tabTabEndPoint = util.format(
			AutoCompletionService.TABTAB_COMPLETION_END_REGEX_PATTERN,
			clientName.toLowerCase()
		);
		const tabTabRegex = new RegExp(
			util.format("%s[\\s\\S]*%s", tabTabStartPoint, tabTabEndPoint)
		);
		return tabTabRegex;
	}

	private getTabTabCompletionsRegex(): RegExp {
		return new RegExp(
			util.format(
				"%s[\\s\\S]*%s",
				AutoCompletionService.GENERATED_TABTAB_COMPLETION_START,
				AutoCompletionService.GENERATED_TABTAB_COMPLETION_END
			)
		);
	}

	private removeObsoleteAutoCompletion(): void {
		// In previous releases we were writing directly in .bash_profile, .bashrc, .zshrc and .profile - remove this old code
		const shellProfilesToBeCleared = this.shellProfiles;
		// Add .profile only here as we do not want new autocompletion in this file, but we have to remove our old code from it.
		shellProfilesToBeCleared.push(this.getHomePath(".profile"));
		shellProfilesToBeCleared.forEach((file) => {
			try {
				const text = this.$fs.readText(file);
				let newText = text.replace(
					this.getTabTabObsoleteRegex(this.$staticConfig.CLIENT_NAME),
					""
				);
				if (this.$staticConfig.CLIENT_NAME_ALIAS) {
					newText = newText.replace(
						this.getTabTabObsoleteRegex(this.$staticConfig.CLIENT_NAME_ALIAS),
						""
					);
				}

				if (newText !== text) {
					this.$logger.trace(
						"Remove obsolete AutoCompletion from file %s.",
						file
					);
					this.$fs.writeFile(file, newText);
				}
			} catch (error) {
				if (error.code !== "ENOENT") {
					this.$logger.trace(
						"Error while trying to disable autocompletion for '%s' file. Error is:\n%s",
						error.toString()
					);
				}
			}
		});
	}

	private removeOboleteTabTabCompletion(text: string) {
		try {
			let newText = text.replace(this.getTabTabObsoleteRegex("ns"), "");

			newText = newText.replace(this.getTabTabObsoleteRegex("nsc"), "");

			newText = newText.replace(
				this.getTabTabObsoleteRegex("nativescript"),
				""
			);

			newText = newText.replace(this.getTabTabObsoleteRegex("tns"), "");

			return newText;
		} catch (error) {
			this.$logger.trace(
				"Error while trying to disable autocompletion for '%s' file. Error is:\n%s",
				error.toString()
			);

			return text;
		}
	}

	@cache()
	private get completionAliasDefinition() {
		const pattern = "compdef _nativescript.js_yargs_completions %s";
		const ns = util.format(pattern, "ns");
		const tns = util.format(pattern, "tns");
		return util.format(
			"\n%s\n%s\n%s\n",
			ns,
			tns,
			AutoCompletionService.GENERATED_TABTAB_COMPLETION_END
		);
	}

	@cache()
	private get completionShellScriptContent() {
		const startText = util.format(
			AutoCompletionService.COMPLETION_START_COMMENT_PATTERN,
			this.$staticConfig.CLIENT_NAME.toLowerCase()
		);
		const content = util.format(
			"if [ -f %s ]; then \n    source %s \nfi",
			this.cliRunCommandsFile,
			this.cliRunCommandsFile
		);
		const endText = util.format(
			AutoCompletionService.COMPLETION_END_COMMENT_PATTERN,
			this.$staticConfig.CLIENT_NAME.toLowerCase()
		);
		return util.format("\n%s\n%s\n%s\n", startText, content, endText);
	}

	public isAutoCompletionEnabled(): boolean {
		let result = true;
		_.each(this.shellProfiles, (filePath) => {
			result =
				this.isNewAutoCompletionEnabledInFile(filePath) ||
				this.isObsoleteAutoCompletionEnabledInFile(filePath);
			if (!result) {
				// break each
				return false;
			}
		});

		return result;
	}

	public disableAutoCompletion(): void {
		_.each(this.shellProfiles, (shellFile) =>
			this.removeAutoCompletionFromShellScript(shellFile)
		);
		this.removeObsoleteAutoCompletion();

		if (this.scriptsOk && this.scriptsUpdated) {
			this.$logger.info(
				"Restart your shell to disable command auto-completion."
			);
		}
	}

	public async enableAutoCompletion(): Promise<void> {
		await this.updateCLIShellScript();
		_.each(this.shellProfiles, (shellFile) =>
			this.addAutoCompletionToShellScript(shellFile)
		);
		this.removeObsoleteAutoCompletion();

		if (this.scriptsOk && this.scriptsUpdated) {
			this.$logger.info(
				"Restart your shell to enable command auto-completion."
			);
		}
	}

	public isObsoleteAutoCompletionEnabled(): boolean {
		let result = true;
		_.each(this.shellProfiles, (shellProfile) => {
			result = this.isObsoleteAutoCompletionEnabledInFile(shellProfile);
			if (!result) {
				// break each
				return false;
			}
		});

		return result;
	}

	private isNewAutoCompletionEnabledInFile(fileName: string): boolean {
		try {
			const data = this.$fs.readText(fileName);
			if (data && data.indexOf(this.completionShellScriptContent) !== -1) {
				return true;
			}
		} catch (err) {
			this.$logger.trace(
				"Error while checking is autocompletion enabled in file %s. Error is: '%s'",
				fileName,
				err.toString()
			);
		}

		return false;
	}

	private isObsoleteAutoCompletionEnabledInFile(fileName: string): boolean {
		try {
			const text = this.$fs.readText(fileName);
			return !!(
				text.match(
					this.getTabTabObsoleteRegex(this.$staticConfig.CLIENT_NAME)
				) ||
				text.match(this.getTabTabObsoleteRegex(this.$staticConfig.CLIENT_NAME))
			);
		} catch (err) {
			this.$logger.trace(
				"Error while checking is obsolete autocompletion enabled in file %s. Error is: '%s'",
				fileName,
				err.toString()
			);
		}
	}

	private addAutoCompletionToShellScript(fileName: string): void {
		try {
			if (
				!this.isNewAutoCompletionEnabledInFile(fileName) ||
				this.isObsoleteAutoCompletionEnabledInFile(fileName)
			) {
				this.$logger.trace(
					"AutoCompletion is not enabled in %s file. Trying to enable it.",
					fileName
				);
				this.$fs.appendFile(fileName, this.completionShellScriptContent);
				this.scriptsUpdated = true;
			}
		} catch (err) {
			this.$logger.info(
				"Unable to update %s. Command-line completion might not work.",
				fileName
			);
			// When npm is installed with sudo, in some cases the installation cannot write to shell profiles
			// Advise the user how to enable autocompletion after the installation is completed.
			if (
				(err.code === "EPERM" || err.code === "EACCES") &&
				!this.$hostInfo.isWindows &&
				process.env.SUDO_USER
			) {
				this.$logger.info(
					"To enable command-line completion, run '$ %s autocomplete enable'.",
					this.$staticConfig.CLIENT_NAME
				);
			}

			this.$logger.trace(err);
			this.scriptsOk = false;
		}
	}

	private removeAutoCompletionFromShellScript(fileName: string): void {
		try {
			if (this.isNewAutoCompletionEnabledInFile(fileName)) {
				this.$logger.trace(
					"AutoCompletion is enabled in %s file. Trying to disable it.",
					fileName
				);
				let data = this.$fs.readText(fileName);
				data = data.replace(this.completionShellScriptContent, "");
				this.$fs.writeFile(fileName, data);
				this.scriptsUpdated = true;
			}
		} catch (err) {
			// If file does not exist, autocompletion was not working for it, so ignore this error.
			if (err.code !== "ENOENT") {
				this.$logger.info(
					"Failed to update %s. Auto-completion may still work or work incorrectly. ",
					fileName
				);
				this.$logger.info(err);
				this.scriptsOk = false;
			}
		}
	}

	private async updateCLIShellScript(): Promise<void> {
		const filePath = this.cliRunCommandsFile;

		try {
			let doUpdate = true;
			if (this.$fs.exists(filePath)) {
				const contents = this.$fs.readText(filePath);
				const regExp = new RegExp(
					AutoCompletionService.GENERATED_TABTAB_COMPLETION_START
				);
				let matchCondition = contents.match(regExp);

				if (matchCondition) {
					doUpdate = false;
				}
			}

			if (doUpdate) {
				const clientExecutableFileName = (
					this.$staticConfig.CLIENT_NAME_ALIAS || this.$staticConfig.CLIENT_NAME
				).toLowerCase();
				const pathToExecutableFile = path.join(
					__dirname,
					`../../../bin/${clientExecutableFileName}.js`
				);

				if (this.$fs.exists(filePath)) {
					const existingText = this.$fs.readText(filePath);
					let newText = existingText.replace(
						this.getTabTabCompletionsRegex(),
						""
					);
					newText = this.removeOboleteTabTabCompletion(newText);
					if (newText !== existingText) {
						this.$logger.trace(
							"Remove existing AutoCompletion from file %s.",
							filePath
						);
						this.$fs.writeFile(filePath, newText);
					}
				}
				// The generated seems to be inconsistent in it's start/end markers so adding our own.

				this.$fs.appendFile(
					filePath,
					`\n${AutoCompletionService.GENERATED_TABTAB_COMPLETION_START}\n`
				);
				await this.$childProcess.exec(
					`"${process.argv[0]}" "${pathToExecutableFile}" completion_generate_script >> "${filePath}"`
				);
				this.$fs.appendFile(filePath, this.completionAliasDefinition);

				this.$fs.chmod(filePath, "0644");
			}
		} catch (err) {
			this.$logger.info(
				"Failed to update %s. Auto-completion may not work. ",
				filePath
			);
			this.$logger.trace(err);
			this.scriptsOk = false;
		}
	}

	private getHomePath(fileName: string): string {
		return path.join(homedir(), fileName);
	}
}
injector.register("autoCompletionService", AutoCompletionService);
