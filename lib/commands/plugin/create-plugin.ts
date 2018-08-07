import * as path from "path";
import { isInteractive } from "../../common/helpers";

export class CreatePluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public userMessage = "What is your GitHub username?\n(will be used to update the Github URLs in the plugin's package.json)";
	public nameMessage = "";
	constructor(private $options: IOptions,
		private $errors: IErrors,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $logger: ILogger,
		private $pacoteService: IPacoteService,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $prompter: IPrompter) { }

	public async execute(args: string[]): Promise<void> {
		const pluginRepoName = args[0];
		const pathToProject = this.$options.path;
		const selectedPath = path.resolve(pathToProject || ".");
		const projectDir = path.join(selectedPath, pluginRepoName);

		this.$logger.printMarkdown("Downloading the latest version of NativeScript Plugin Seed...");
		await this.downloadPackage(projectDir);

		this.$logger.printMarkdown("Executing initial plugin configuration script...");
		await this.setupSeed(projectDir, pluginRepoName);

		this.$logger.printMarkdown("Solution for `%s` was successfully created.", pluginRepoName);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.fail("You must specify the plugin repository name.");
		}

		return true;
	}

	private async setupSeed(projectDir: string, pluginRepoName: string): Promise<void> {
		const config = this.$options;
		const spinner = this.$terminalSpinnerService.createSpinner();
		const cwd = path.join(projectDir, "src");
		try {
			spinner.start();
			await this.$childProcess.exec("npm i", { cwd: cwd });
		} finally {
			spinner.stop();
		}

		let gitHubUsername = config.username;
		if (!gitHubUsername) {
			gitHubUsername = "NativeScriptDeveloper";
			if (isInteractive()) {
				gitHubUsername = await this.$prompter.getString(this.userMessage, { allowEmpty: false, defaultAction: () => { return gitHubUsername; } });
			}
		}

		let pluginNameSource = config.pluginName;
		if (!pluginNameSource) {
			// remove nativescript- prefix for naming plugin files
			const prefix = 'nativescript-';
			pluginNameSource = pluginRepoName.toLowerCase().startsWith(prefix) ? pluginRepoName.slice(prefix.length, pluginRepoName.length) : pluginRepoName;
			if (isInteractive()) {
				pluginNameSource = await this.$prompter.getString(this.nameMessage, { allowEmpty: false, defaultAction: () => { return pluginNameSource; } });
			}
		}

		if (!isInteractive() && (!config.username || !config.pluginName)) {
			this.$logger.printMarkdown("Using default values for Github user and/or plugin name since your shell is not interactive.");
		}

		const params = `gitHubUsername=${gitHubUsername} pluginName=${pluginNameSource} initGit=y`;
		// run postclone script manually and kill it if it takes more than 10 sec
		const outputScript = (await this.$childProcess.exec(`node scripts/postclone ${params}`, { cwd: cwd, timeout: 10000 }));
		this.$logger.printMarkdown(outputScript);
	}

	private async downloadPackage(projectDir: string): Promise<void> {
		this.$fs.createDirectory(projectDir);

		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const packageToInstall = "https://github.com/NativeScript/nativescript-plugin-seed/archive/master.tar.gz";
		try {
			spinner.start();
			await this.$pacoteService.extractPackage(packageToInstall, projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		} finally {
			spinner.stop();
		}
	}
}

$injector.registerCommand(["plugin|create"], CreatePluginCommand);
