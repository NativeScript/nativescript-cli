import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { injector } from "../../common/yok";
import { PrepareCommand } from "../prepare";
import { PrepareController } from "../../controllers/prepare-controller";
import { IOptions, IPlatformValidationService } from "../../declarations";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import { IPlatformsDataService } from "../../definitions/platform";
import { PrepareDataService } from "../../services/prepare-data-service";
import { IMigrateController } from "../../definitions/migrate";
import { resolve } from "path";
import { IFileSystem } from "../../common/declarations";
import { color } from "../../color";

export class EmbedCommand extends PrepareCommand implements ICommand {
	constructor(
		public $options: IOptions,
		public $prepareController: PrepareController,
		public $platformValidationService: IPlatformValidationService,
		public $projectData: IProjectData,
		public $platformCommandParameter: ICommandParameter,
		public $platformsDataService: IPlatformsDataService,
		public $prepareDataService: PrepareDataService,
		public $migrateController: IMigrateController,

		private $logger: ILogger,
		private $fs: IFileSystem,
		private $projectConfigService: IProjectConfigService,
	) {
		super(
			$options,
			$prepareController,
			$platformValidationService,
			$projectData,
			$platformCommandParameter,
			$platformsDataService,
			$prepareDataService,
			$migrateController,
		);
	}

	private resolveHostProjectPath(hostProjectPath: string): string {
		if (hostProjectPath.charAt(0) === ".") {
			// resolve relative to the project dir
			const projectDir = this.$projectData.projectDir;
			return resolve(projectDir, hostProjectPath);
		}

		return resolve(hostProjectPath);
	}

	public async execute(args: string[]): Promise<void> {
		const hostProjectPath = args[1];
		const resolvedHostProjectPath =
			this.resolveHostProjectPath(hostProjectPath);

		if (!this.$fs.exists(resolvedHostProjectPath)) {
			this.$logger.error(
				`The host project path ${color.yellow(
					hostProjectPath,
				)} (resolved to: ${color.styleText(
					["yellow", "dim"],
					resolvedHostProjectPath,
				)}) does not exist.`,
			);
			return;
		}

		this.$options["hostProjectPath"] = resolvedHostProjectPath;
		if (args.length > 2) {
			this.$options["hostProjectModuleName"] = args[2];
		}

		return super.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const canSuperExecute = await super.canExecute(args);

		if (!canSuperExecute) {
			return false;
		}

		// args[0] is the platform
		// args[1] is the path to the host project
		// args[2] is the host project module name

		const platform = args[0].toLowerCase();

		// also allow these to be set in the nativescript.config.ts
		if (!args[1]) {
			const hostProjectPath = this.getEmbedConfigForKey(
				"hostProjectPath",
				platform,
			);
			if (hostProjectPath) {
				args[1] = hostProjectPath;
			}
		}

		if (!args[2]) {
			const hostProjectModuleName = this.getEmbedConfigForKey(
				"hostProjectModuleName",
				platform,
			);
			if (hostProjectModuleName) {
				args[2] = hostProjectModuleName;
			}
		}

		console.log(args);

		if (args.length < 2) {
			return false;
		}

		return true;
	}

	private getEmbedConfigForKey(key: string, platform: string) {
		// get the embed.<platform>.<key> value, or fallback to embed.<key> value
		return this.$projectConfigService.getValue(
			`embed.${platform}.${key}`,
			this.$projectConfigService.getValue(`embed.${key}`),
		);
	}
}

injector.registerCommand("embed", EmbedCommand);
