import * as path from "path";
import { isInteractive } from "../../common/helpers";
import { INodePackageManager } from "../../declarations";
import { IErrors, IFileSystem, IChildProcess } from "../../common/declarations";
import {
	Command,
	CommandOptionsInput,
	CommandOptionsSchema,
	stringOption,
} from "../../common/define-command";
import { CliOptions } from "../../common/contracts/cli-options";
import { inject } from "../../common/di";
import { ITerminalSpinnerService } from "../../definitions/terminal-spinner-service";

export const USER_MESSAGE =
	"What is your GitHub username?\n(will be used to update the Github URLs in the plugin's package.json)";
export const NAME_MESSAGE =
	"What will be the name of your plugin?\n(use lowercase characters and dashes only)";
export const INCLUDE_TYPESCRIPT_DEMO_MESSAGE =
	'Do you want to include a "TypeScript NativeScript" application linked with your plugin to make development easier?';
export const INCLUDE_ANGULAR_DEMO_MESSAGE =
	'Do you want to include an "Angular NativeScript" application linked with your plugin to make development easier?';
export const PATH_ALREADY_EXISTS_MESSAGE_TEMPLATE =
	"Path already exists and is not empty %s";

const createPluginCommandOptions = [
	CliOptions,
	{
		template: stringOption(),
		username: stringOption(),
		pluginName: stringOption(),
		includeTypeScriptDemo: stringOption(),
		includeAngularDemo: stringOption(),
	} satisfies CommandOptionsSchema,
] satisfies CommandOptionsInput;

export class CreatePluginCommand extends Command({
	name: "plugin|create",
	description: "Creates a new project for a NativeScript plugin.",
	options: createPluginCommandOptions,
	params: "any",
}) {
	private $errors = inject<IErrors>("errors");
	private $terminalSpinnerService = inject<ITerminalSpinnerService>(
		"terminalSpinnerService",
	);
	private $logger = inject<ILogger>("logger");
	private $pacoteService = inject<IPacoteService>("pacoteService");
	private $fs = inject<IFileSystem>("fs");
	private $childProcess = inject<IChildProcess>("childProcess");
	private $prompter = inject<IPrompter>("prompter");
	private $packageManager = inject<INodePackageManager>("packageManager");

	public canExecute(): boolean {
		if (!this.args[0]) {
			this.context.fail("You must specify the plugin repository name.");
		}

		return true;
	}

	public async run(): Promise<void> {
		const pluginRepoName = this.args[0];
		const pathToProject = this.options.path;
		const selectedTemplate = this.options.template;
		const selectedPath = path.resolve(pathToProject || ".");
		const projectDir = path.join(selectedPath, pluginRepoName);

		// Must be out of try catch block, because will throw error if folder alredy exists and we don't want to delete it.
		this.ensurePackageDir(projectDir);

		try {
			await this.downloadPackage(selectedTemplate, projectDir);
			await this.setupSeed(projectDir, pluginRepoName);
		} catch (err) {
			// The call to ensurePackageDir() above will throw error if folder alredy exists, so it is safe to delete here.
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		this.$logger.printMarkdown(
			"Solution for `%s` was successfully created.",
			pluginRepoName,
		);
	}

	private ensurePackageDir(projectDir: string): void {
		this.$fs.createDirectory(projectDir);

		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail(PATH_ALREADY_EXISTS_MESSAGE_TEMPLATE, projectDir);
		}
	}

	private async downloadPackage(
		selectedTemplate: string,
		projectDir: string,
	): Promise<void> {
		if (selectedTemplate) {
			this.$logger.printMarkdown(
				"Make sure your custom template is compatible with the Plugin Seed at https://github.com/NativeScript/nativescript-plugin-seed/",
			);
		} else {
			this.$logger.printMarkdown(
				"Downloading the latest version of NativeScript Plugin Seed...",
			);
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const packageToInstall =
			selectedTemplate ||
			"https://github.com/NativeScript/nativescript-plugin-seed/archive/master.tar.gz";
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
				gitHubUsername = await this.$prompter.getString(USER_MESSAGE, {
					allowEmpty: false,
					defaultAction: () => {
						return gitHubUsername;
					},
				});
			}
		}

		return gitHubUsername;
	}

	private async getPluginNameSource(
		pluginNameSource: string,
		pluginRepoName: string,
	): Promise<string> {
		if (!pluginNameSource) {
			// remove nativescript- prefix for naming plugin files
			const prefix = "nativescript-";
			pluginNameSource = pluginRepoName.toLowerCase().startsWith(prefix)
				? pluginRepoName.slice(prefix.length, pluginRepoName.length)
				: pluginRepoName;
			if (isInteractive()) {
				pluginNameSource = await this.$prompter.getString(NAME_MESSAGE, {
					allowEmpty: false,
					defaultAction: () => {
						return pluginNameSource;
					},
				});
			}
		}

		return pluginNameSource;
	}

	private async getShouldIncludeDemoResult(
		includeDemoOption: string,
		message: string,
	): Promise<string> {
		let shouldIncludeDemo = !!includeDemoOption;
		if (!includeDemoOption && isInteractive()) {
			shouldIncludeDemo = await this.$prompter.confirm(message, () => {
				return true;
			});
		}

		return shouldIncludeDemo ? "y" : "n";
	}

	private async setupSeed(
		projectDir: string,
		pluginRepoName: string,
	): Promise<void> {
		this.$logger.printMarkdown(
			"Executing initial plugin configuration script...",
		);

		const config = this.options;
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
		const pluginNameSource = await this.getPluginNameSource(
			config.pluginName,
			pluginRepoName,
		);
		const includeTypescriptDemo = await this.getShouldIncludeDemoResult(
			config.includeTypeScriptDemo,
			INCLUDE_TYPESCRIPT_DEMO_MESSAGE,
		);
		const includeAngularDemo = await this.getShouldIncludeDemoResult(
			config.includeAngularDemo,
			INCLUDE_ANGULAR_DEMO_MESSAGE,
		);

		if (
			!isInteractive() &&
			(!config.username ||
				!config.pluginName ||
				!config.includeAngularDemo ||
				!config.includeTypeScriptDemo)
		) {
			this.$logger.printMarkdown(
				"Using default values for plugin creation options since your shell is not interactive.",
			);
		}

		// run postclone script manually and kill it if it takes more than 10 sec
		const pathToPostCloneScript = path.join("scripts", "postclone");
		const params = [
			pathToPostCloneScript,
			`gitHubUsername=${gitHubUsername}`,
			`pluginName=${pluginNameSource}`,
			"initGit=y",
			`includeTypeScriptDemo=${includeTypescriptDemo}`,
			`includeAngularDemo=${includeAngularDemo}`,
		];

		const outputScript = await this.$childProcess.spawnFromEvent(
			process.execPath,
			params,
			"close",
			{ stdio: "inherit", cwd, timeout: 10000 },
		);
		if (outputScript && outputScript.stdout) {
			this.$logger.printMarkdown(outputScript.stdout);
		}
	}
}
