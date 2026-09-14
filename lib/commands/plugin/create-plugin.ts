import * as path from "path";
import { isInteractive } from "../../common/helpers";
import { INodePackageManager } from "../../declarations";
import { IErrors, IFileSystem, IChildProcess } from "../../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../common/define-command";
import { inject } from "../../common/di";
import { registerCommand } from "../../common/services/command-definition-adapter";
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

const createPluginCommandOptions = {
	path: stringOption(),
	template: stringOption(),
	username: stringOption(),
	pluginName: stringOption(),
	includeTypeScriptDemo: stringOption(),
	includeAngularDemo: stringOption(),
} satisfies CommandOptionsSchema;

export type CreatePluginCommandContext = CommandContext<
	typeof createPluginCommandOptions
>;

export interface ICreatePluginCommandServices {
	$errors: IErrors;
	$terminalSpinnerService: ITerminalSpinnerService;
	$logger: ILogger;
	$pacoteService: IPacoteService;
	$fs: IFileSystem;
	$childProcess: IChildProcess;
	$prompter: IPrompter;
	$packageManager: INodePackageManager;
}

export function setupCreatePluginCommand(): ICreatePluginCommandServices {
	return {
		$errors: inject<IErrors>("errors"),
		$terminalSpinnerService: inject<ITerminalSpinnerService>(
			"terminalSpinnerService",
		),
		$logger: inject<ILogger>("logger"),
		$pacoteService: inject<IPacoteService>("pacoteService"),
		$fs: inject<IFileSystem>("fs"),
		$childProcess: inject<IChildProcess>("childProcess"),
		$prompter: inject<IPrompter>("prompter"),
		$packageManager: inject<INodePackageManager>("packageManager"),
	};
}

function ensurePackageDir(
	services: ICreatePluginCommandServices,
	projectDir: string,
): void {
	services.$fs.createDirectory(projectDir);

	if (services.$fs.exists(projectDir) && !services.$fs.isEmptyDir(projectDir)) {
		services.$errors.fail(PATH_ALREADY_EXISTS_MESSAGE_TEMPLATE, projectDir);
	}
}

async function downloadPackage(
	services: ICreatePluginCommandServices,
	selectedTemplate: string,
	projectDir: string,
): Promise<void> {
	if (selectedTemplate) {
		services.$logger.printMarkdown(
			"Make sure your custom template is compatible with the Plugin Seed at https://github.com/NativeScript/nativescript-plugin-seed/",
		);
	} else {
		services.$logger.printMarkdown(
			"Downloading the latest version of NativeScript Plugin Seed...",
		);
	}

	const spinner = services.$terminalSpinnerService.createSpinner();
	const packageToInstall =
		selectedTemplate ||
		"https://github.com/NativeScript/nativescript-plugin-seed/archive/master.tar.gz";
	try {
		spinner.start();
		await services.$pacoteService.extractPackage(packageToInstall, projectDir);
	} finally {
		spinner.stop();
	}
}

async function getGitHubUsername(
	services: ICreatePluginCommandServices,
	gitHubUsername: string,
): Promise<string> {
	if (!gitHubUsername) {
		gitHubUsername = "NativeScriptDeveloper";
		if (isInteractive()) {
			gitHubUsername = await services.$prompter.getString(USER_MESSAGE, {
				allowEmpty: false,
				defaultAction: () => {
					return gitHubUsername;
				},
			});
		}
	}

	return gitHubUsername;
}

async function getPluginNameSource(
	services: ICreatePluginCommandServices,
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
			pluginNameSource = await services.$prompter.getString(NAME_MESSAGE, {
				allowEmpty: false,
				defaultAction: () => {
					return pluginNameSource;
				},
			});
		}
	}

	return pluginNameSource;
}

async function getShouldIncludeDemoResult(
	services: ICreatePluginCommandServices,
	includeDemoOption: string,
	message: string,
): Promise<string> {
	let shouldIncludeDemo = !!includeDemoOption;
	if (!includeDemoOption && isInteractive()) {
		shouldIncludeDemo = await services.$prompter.confirm(message, () => {
			return true;
		});
	}

	return shouldIncludeDemo ? "y" : "n";
}

async function setupSeed(
	context: CreatePluginCommandContext,
	services: ICreatePluginCommandServices,
	projectDir: string,
	pluginRepoName: string,
): Promise<void> {
	services.$logger.printMarkdown(
		"Executing initial plugin configuration script...",
	);

	const config = context.options;
	const spinner = services.$terminalSpinnerService.createSpinner();
	const cwd = path.join(projectDir, "src");
	try {
		spinner.start();
		const npmOptions: any = { silent: true };
		await services.$packageManager.install(cwd, cwd, npmOptions);
	} finally {
		spinner.stop();
	}

	const gitHubUsername = await getGitHubUsername(services, config.username);
	const pluginNameSource = await getPluginNameSource(
		services,
		config.pluginName,
		pluginRepoName,
	);
	const includeTypescriptDemo = await getShouldIncludeDemoResult(
		services,
		config.includeTypeScriptDemo,
		INCLUDE_TYPESCRIPT_DEMO_MESSAGE,
	);
	const includeAngularDemo = await getShouldIncludeDemoResult(
		services,
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
		services.$logger.printMarkdown(
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

	const outputScript = await services.$childProcess.spawnFromEvent(
		process.execPath,
		params,
		"close",
		{ stdio: "inherit", cwd, timeout: 10000 },
	);
	if (outputScript && outputScript.stdout) {
		services.$logger.printMarkdown(outputScript.stdout);
	}
}

export async function runCreatePluginCommand(
	context: CreatePluginCommandContext,
	services: ICreatePluginCommandServices,
): Promise<void> {
	const pluginRepoName = context.args[0];
	const pathToProject = context.options.path;
	const selectedTemplate = context.options.template;
	const selectedPath = path.resolve(pathToProject || ".");
	const projectDir = path.join(selectedPath, pluginRepoName);

	// Must be out of try catch block, because will throw error if folder alredy exists and we don't want to delete it.
	ensurePackageDir(services, projectDir);

	try {
		await downloadPackage(services, selectedTemplate, projectDir);
		await setupSeed(context, services, projectDir, pluginRepoName);
	} catch (err) {
		// The call to ensurePackageDir() above will throw error if folder alredy exists, so it is safe to delete here.
		services.$fs.deleteDirectory(projectDir);
		throw err;
	}

	services.$logger.printMarkdown(
		"Solution for `%s` was successfully created.",
		pluginRepoName,
	);
}

export const createPluginCommandDefinition = defineCommand({
	name: "plugin|create",
	description: "Creates a new project for a NativeScript plugin.",
	options: createPluginCommandOptions,
	arguments: "any",
	setup: setupCreatePluginCommand,
	canExecute(context, services): boolean {
		if (!context.args[0]) {
			services.$errors.failWithHelp(
				"You must specify the plugin repository name.",
			);
		}

		return true;
	},
	run: runCreatePluginCommand,
});

registerCommand(createPluginCommandDefinition);
