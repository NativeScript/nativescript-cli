import * as path from "path";
import * as _ from "lodash";
import { IErrors, IFileSystem, IProjectHelper } from "./declarations";
import { IOptions } from "../declarations";
import { injector } from "./yok";
import { SCOPED_TNS_CORE_MODULES, TNS_CORE_MODULES_NAME } from "../constants";
import { IProjectData } from "../definitions/project";
import { IInjector } from "./definitions/yok";

export class ProjectHelper implements IProjectHelper {
	constructor(
		private $injector: IInjector,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $staticConfig: Config.IStaticConfig,
		private $errors: IErrors,
		private $options: IOptions
	) {}

	private cachedProjectDir = "";

	public get projectDir(): string {
		if (this.cachedProjectDir !== "") {
			return this.cachedProjectDir;
		}
		this.cachedProjectDir = null;

		let projectDir = path.resolve(this.$options.path || ".");
		while (true) {
			this.$logger.trace("Looking for project in '%s'", projectDir);
			const projectFilePath = path.join(
				projectDir,
				this.$staticConfig.PROJECT_FILE_NAME
			);

			if (
				this.$fs.exists(projectFilePath) &&
				this.isProjectFileCorrect(projectFilePath)
			) {
				this.$logger.trace("Project directory is '%s'.", projectDir);
				this.cachedProjectDir = projectDir;
				break;
			}

			const dir = path.dirname(projectDir);
			if (dir === projectDir) {
				this.$logger.trace(
					"No project found at or above '%s'.",
					this.$options.path || path.resolve(".")
				);
				break;
			}
			projectDir = dir;
		}

		return this.cachedProjectDir;
	}

	public generateDefaultAppId(appName: string, baseAppId: string): string {
		let sanitizedName = this.sanitizeName(appName);
		if (sanitizedName) {
			if (/^\d+$/.test(sanitizedName)) {
				sanitizedName = "the" + sanitizedName;
			}
		} else {
			sanitizedName = "the";
		}

		return `${baseAppId}.${sanitizedName}`;
	}

	public sanitizeName(appName: string): string {
		const sanitizedName = _.filter(appName.split(""), (c) =>
			/[a-zA-Z0-9]/.test(c)
		).join("");
		return sanitizedName;
	}

	private isProjectFileCorrect(projectFilePath: string): boolean {
		try {
			const fileContent = this.$fs.readText(projectFilePath);
			const packageName = this.getProjectData(path.dirname(projectFilePath)).nsConfig.corePackageName || SCOPED_TNS_CORE_MODULES;
			
			return (
				fileContent.includes(packageName) ||
				fileContent.includes(TNS_CORE_MODULES_NAME)
			);
		} catch (err) {
			this.$errors.fail(
				"The project file is corrupted. Additional technical information: %s",
				err
			);
		}

		return false;
	}
	private getProjectData(projectFilePath: string): IProjectData {
		try {
			const projectData: IProjectData = this.$injector.resolve("projectData");
			projectData.initializeProjectData(projectFilePath);
			return projectData;
		} catch (error) {
			console.error(error)
			return null;
		}
	}
}

injector.register("projectHelper", ProjectHelper);
