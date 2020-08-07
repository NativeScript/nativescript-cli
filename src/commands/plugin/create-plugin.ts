import * as path from "path";
import { isInteractive } from "../../common/helpers";

export class CreatePluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public userMessage = "What is your GitHub username?\n(will be used to update the Github URLs in the plugin's package.json)";
	public nameMessage = "What will be the name of your plugin?\n(use lowercase characters and dashes only)";
	public includeTypeScriptDemoMessage = 'Do you want to include a "TypeScript NativeScript" application linked with your plugin to make development easier?';
	public includeAngularDemoMessage = 'Do you want to include an "Angular NativeScript" application linked with your plugin to make development easier?';
	public pathAlreadyExistsMessageTemplate = "Path already exists and is not empty %s";
	constructor(private $options: IOptions,
		private $errors: IErrors,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $logger: ILogger,
		private $pacoteService: IPacoteService,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $prompter: IPrompter,
		private $packageManager: INodePackageManager) { }

	public async execute(args: string[]): Promise<void> {
		const pluginRepoName = args[0];
		const pathToProject = this.$options.path;
		const selectedTemplate = this.$options.template;
		const selectedPath = path.resolve(pathToProject || ".");
		const projectDir = path.join(selectedPath, pluginRepoName);

		// Must be out of try catch block, because will throw error if folder alredy exists and we don't want to delete it.
		this.ensurePackageDir(projectDir);

		try {
			await this.downloadPackage(selectedTemplate, projectDir);
			await this.setupSeed(projectDir, pluginRepoName);
		} catch (err) {
			// The call to this.ensurePackageDir() above will throw error if folder alredy exists, so it is safe to delete here.
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		this.$logger.printMarkdown("Solution for `%s` was successfully created.", pluginRepoName);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.failWithHelp("You must specify the plugin repository name.");
		}

		return true;
	}

	private async setupSeed(projectDir: string, pluginRepoName: string): Promise<void> {
		this.$logger.printMarkdown("Executing initial plugin configuration script...");

		const config = this.$options;
		const spinner = this.$terminalSpinnerService.createSpinner();
		const cwd = path.join(projectDir, "src");
		try {
			spinner.start();
			const npmOptions: any = { silent: true };
			await this.$packageManager.install(cwd, cwd, npmOptions);
		} finally {
			spinner.stop();
		}

		const gitHubUsername = await this.getGitHubUsername(config.username);
		const pluginNameSource = await this.getPluginNameSource(config.pluginName, pluginRepoName);
		const includeTypescriptDemo = await this.getShouldIncludeDemoResult(config.includeTypeScriptDemo, this.includeTypeScriptDemoMessage);
		const includeAngularDemo = await this.getShouldIncludeDemoResult(config.includeAngularDemo, this.includeAngularDemoMessage);

		if (!isInteractive() && (!config.username || !config.pluginName || !config.includeAngularDemo || !config.includeTypeScriptDemo)) {
			this.$logger.printMarkdown("Using default values for plugin creation options since your shell is not interactive.");
		}

		// run postclone script manually and kill it if it takes more than 10 sec
		const pathToPostCloneScript = path.join("scripts", "postclone");
		const params = [
			pathToPostCloneScript,
			`gitHubUsername=${gitHubUsername}`,
			`pluginName=${pluginNameSource}`,
			"initGit=y",
			`includeTypeScriptDemo=${includeTypescriptDemo}`,
			`includeAngularDemo=${includeAngularDemo}`
		];

		const outputScript = (await this.$childProcess.spawnFromEvent(process.execPath, params, "close", { stdio: "inherit", cwd, timeout: 10000 }));
		if (outputScript && outputScript.stdout) {
			this.$logger.printMarkdown(outputScript.stdout);
		}
	}

	private ensurePackageDir(projectDir: string): void {
		this.$fs.createDirectory(projectDir);

		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail(this.pathAlreadyExistsMessageTemplate, projectDir);
		}
	}

	private async downloadPackage(selectedTemplate: string, projectDir: string): Promise<void> {
		if (selectedTemplate) {
			this.$logger.printMarkdown("Make sure your custom template is compatible with the Plugin Seed at https://github.com/NativeScript/nativescript-plugin-seed/");
		} else {
			this.$logger.printMarkdown("Downloading the latest version of NativeScript Plugin Seed...");
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const packageToInstall = selectedTemplate || "https://github.com/NativeScript/nativescript-plugin-seed/archive/master.tar.gz";
		try {
			spinner.start();
			await this.$pacoteService.extractPackage(packageToInstall, projectDir);
		} finally {
			spinner.stop();
		}
	}

	private async getGitHubUsername(gitHubUsername: string): Promise<string> {
		if (!gitHubUsername) {
			gitHubUsername = "NativeScriptDeveloper";
			if (isInteractive()) {
				gitHubUsername = await this.$prompter.getString(this.userMessage, { allowEmpty: false, defaultAction: () => { return gitHubUsername; } });
			}
		}

		return gitHubUsername;
	}

	private async getPluginNameSource(pluginNameSource: string, pluginRepoName: string): Promise<string> {
		if (!pluginNameSource) {
			// remove nativescript- prefix for naming plugin files
			const prefix = 'nativescript-';
			pluginNameSource = pluginRepoName.toLowerCase().startsWith(prefix) ? pluginRepoName.slice(prefix.length, pluginRepoName.length) : pluginRepoName;
			if (isInteractive()) {
				pluginNameSource = await this.$prompter.getString(this.nameMessage, { allowEmpty: false, defaultAction: () => { return pluginNameSource; } });
			}
		}

		return pluginNameSource;
	}

	private async getShouldIncludeDemoResult(includeDemoOption: string, message: string): Promise<string> {
		let shouldIncludeDemo = !!includeDemoOption;
		if (!includeDemoOption && isInteractive()) {
			shouldIncludeDemo = await this.$prompter.confirm(message, () => { return true; });
		}

		return shouldIncludeDemo ? "y" : "n";
	}
}

$injector.registerCommand(["plugin|create"], CreatePluginCommand);
