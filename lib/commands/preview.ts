import { resolvePackagePath } from "@rigor789/resolve-package-path";
import * as path from "path";
import { color } from "../color";
import { IChildProcess, IErrors } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";
import { PackageManagers } from "../constants";
import { IPackageManager } from "../declarations";
import { IProjectData } from "../definitions/project";

const PREVIEW_CLI_PACKAGE = "@nativescript/preview-cli";

const previewCommandOptions = {
	disableNpmInstall: booleanOption(),
} satisfies CommandOptionsSchema;

export type PreviewCommandContext = CommandContext<
	typeof previewCommandOptions
>;

export interface IPreviewCommandServices {
	$childProcess: IChildProcess;
	$errors: IErrors;
	$logger: ILogger;
	$packageManager: IPackageManager;
	$projectData: IProjectData;
}

export function setupPreviewCommand(): IPreviewCommandServices {
	return {
		$childProcess: inject<IChildProcess>("childProcess"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$packageManager: inject<IPackageManager>("packageManager"),
		$projectData: inject<IProjectData>("projectData"),
	};
}

function getPreviewCLIPath(services: IPreviewCommandServices): string {
	return resolvePackagePath(PREVIEW_CLI_PACKAGE, {
		paths: [services.$projectData.projectDir],
	});
}

export async function runPreviewCommand(
	context: PreviewCommandContext,
	services: IPreviewCommandServices,
): Promise<void> {
	if (!context.options.disableNpmInstall) {
		// ensure latest is installed
		await services.$packageManager.install(
			`${PREVIEW_CLI_PACKAGE}@latest`,
			services.$projectData.projectDir,
			{
				"save-dev": true,
				"save-exact": true,
			} as any,
		);
	}

	const previewCLIPath = getPreviewCLIPath(services);

	if (!previewCLIPath) {
		const packageManagerName =
			await services.$packageManager.getPackageManagerName();
		let installCommand = "";

		switch (packageManagerName) {
			case PackageManagers.yarn:
			case PackageManagers.yarn2:
				installCommand = "yarn add -D @nativescript/preview-cli";
				break;
			case PackageManagers.pnpm:
				installCommand = "pnpm install --save-dev @nativescript/preview-cli";
				break;
			case PackageManagers.bun:
				installCommand = "bun add --dev @nativescript/preview-cli";
			case PackageManagers.npm:
			default:
				installCommand = "npm install --save-dev @nativescript/preview-cli";
				break;
		}
		services.$logger.info(
			[
				`Uhh ohh, no Preview CLI found.`,
				"",
				`This should not happen under regular circumstances, but seems like it did somehow... :(`,
				`Good news though, you can install the Preview CLI by running`,
				"",
				"  " + color.green(installCommand),
				"",
				"Once installed, run this command again and everything should work!",
				"If it still fails, you can invoke the preview-cli directly as a last resort with",
				"",
				color.cyan("  ./node_modules/.bin/preview-cli"),
				"",
				"And if you are still having issues, try again - or reach out on Discord/open an issue on GitHub.",
			].join("\n"),
		);

		services.$errors.fail("Running preview failed.");
	}

	const previewCLIBinPath = path.resolve(previewCLIPath, "./dist/index.js");

	// The preview CLI takes the command line verbatim, including flags this CLI
	// does not know, so the raw process arguments are what it gets rather than
	// anything the command layer parsed.
	const commandIndex = process.argv.indexOf("preview");
	const commandArgs = process.argv.slice(commandIndex + 1);
	services.$childProcess.spawn(
		process.execPath,
		[previewCLIBinPath, ...commandArgs],
		{
			stdio: "inherit",
		},
	);
}

export const previewCommandDefinition = defineCommand({
	name: "preview",
	description: "Runs your project with the NativeScript Preview CLI.",
	options: previewCommandOptions,
	// Arguments have never been rejected here, only ignored: they reach the
	// preview CLI through the raw argv instead.
	arguments: "any",
	allowUnknownOptions: true,
	setup: setupPreviewCommand,
	run: runPreviewCommand,
});

registerCommand(previewCommandDefinition);
