import { resolve } from "path";
import { color } from "../../color";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IFileSystem } from "../../common/declarations";
import { IProjectConfigService } from "../../definitions/project";
import { platformArgument } from "../command-base";
import {
	canExecutePrepareCommand,
	prepareCommandOptions,
	runPrepareCommand,
	setupPrepareCommand,
} from "../prepare";

function resolveHostProjectPath(
	projectDir: string,
	hostProjectPath: string,
): string {
	if (hostProjectPath.charAt(0) === ".") {
		return resolve(projectDir, hostProjectPath);
	}

	return resolve(hostProjectPath);
}

export const embedCommandDefinition = defineCommand({
	name: "embed",
	description:
		"Prepares the project so it can be embedded into a native host project.",
	options: prepareCommandOptions,
	arguments: [
		platformArgument,
		{ name: "hostProjectPath" },
		{ name: "hostProjectModuleName" },
	],
	setup(context) {
		const services = setupPrepareCommand();
		const $projectConfigService = inject<IProjectConfigService>(
			"projectConfigService",
		);
		const platform = (context.args[0] || "").toLowerCase();
		// embed.<platform>.<key>, falling back to embed.<key>
		const configValue = (key: string): string =>
			$projectConfigService.getValue(
				`embed.${platform}.${key}`,
				$projectConfigService.getValue(`embed.${key}`),
			);

		return {
			...services,
			$fs: inject<IFileSystem>("fs"),
			$logger: inject<ILogger>("logger"),
			hostProjectPath: context.args[1] || configValue("hostProjectPath"),
			hostProjectModuleName:
				context.args[2] || configValue("hostProjectModuleName"),
		};
	},
	async canExecute(context, services): Promise<boolean> {
		if (!(await canExecutePrepareCommand(context, services))) {
			return false;
		}

		return !!services.hostProjectPath;
	},
	async run(context, services): Promise<void> {
		const resolvedHostProjectPath = resolveHostProjectPath(
			services.$projectData.projectDir,
			services.hostProjectPath,
		);

		if (!services.$fs.exists(resolvedHostProjectPath)) {
			services.$logger.error(
				`The host project path ${color.yellow(
					services.hostProjectPath,
				)} (resolved to: ${color.styleText(
					["yellow", "dim"],
					resolvedHostProjectPath,
				)}) does not exist.`,
			);
			return;
		}

		services.$options.hostProjectPath = resolvedHostProjectPath;
		if (services.hostProjectModuleName) {
			services.$options.hostProjectModuleName = services.hostProjectModuleName;
		}

		await runPrepareCommand(context, services);
	},
});
