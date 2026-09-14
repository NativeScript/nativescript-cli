import { resolve } from "path";
import { color } from "../../color";
import { IOptions } from "../../declarations";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import { Command } from "../../common/define-command";
import { IFileSystem } from "../../common/declarations";
import { inject } from "../../common/di";
import { canExecuteCommand } from "../../common/services/command-definition-adapter";
import { platformArgument } from "../command-base";
import { prepareCommandOptions, runPrepareCommand } from "../prepare";

function resolveHostProjectPath(
	projectDir: string,
	hostProjectPath: string,
): string {
	if (hostProjectPath.charAt(0) === ".") {
		return resolve(projectDir, hostProjectPath);
	}

	return resolve(hostProjectPath);
}

export class EmbedCommand extends Command({
	name: "embed",
	description:
		"Prepares the project so it can be embedded into a native host project.",
	options: prepareCommandOptions,
	arguments: [
		platformArgument,
		{ name: "hostProjectPath" },
		{ name: "hostProjectModuleName" },
	],
}) {
	private $fs = inject<IFileSystem>("fs");
	private $logger = inject<ILogger>("logger");
	private $options = inject<IOptions>("options");
	private $projectConfigService = inject<IProjectConfigService>(
		"projectConfigService",
	);
	private $projectData = inject<IProjectData>("projectData");

	private platform = (this.args[0] || "").toLowerCase();
	private hostProjectPath = this.args[1] || this.configValue("hostProjectPath");
	private hostProjectModuleName =
		this.args[2] || this.configValue("hostProjectModuleName");

	constructor() {
		super();
		this.$projectData.initializeProjectData();
	}

	public async canExecute(): Promise<boolean> {
		// `prepare` takes the platform alone; the host project arguments are this
		// command's own and it would reject them.
		if (!(await canExecuteCommand("prepare", this.args.slice(0, 1)))) {
			return false;
		}

		return !!this.hostProjectPath;
	}

	public async run(): Promise<void> {
		const resolvedHostProjectPath = resolveHostProjectPath(
			this.$projectData.projectDir,
			this.hostProjectPath,
		);

		if (!this.$fs.exists(resolvedHostProjectPath)) {
			this.$logger.error(
				`The host project path ${color.yellow(
					this.hostProjectPath,
				)} (resolved to: ${color.styleText(
					["yellow", "dim"],
					resolvedHostProjectPath,
				)}) does not exist.`,
			);
			return;
		}

		this.$options.hostProjectPath = resolvedHostProjectPath;
		if (this.hostProjectModuleName) {
			this.$options.hostProjectModuleName = this.hostProjectModuleName;
		}

		await runPrepareCommand(this.context);
	}

	/** embed.<platform>.<key>, falling back to embed.<key>. */
	private configValue(key: string): string {
		return this.$projectConfigService.getValue(
			`embed.${this.platform}.${key}`,
			this.$projectConfigService.getValue(`embed.${key}`),
		);
	}
}
