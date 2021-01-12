import * as constants from "../constants";
import * as path from "path";
import { exported } from "../common/decorators";
import { Hooks } from "../constants";
import { performanceLog } from "../common/decorators";
import {
	IProjectService,
	IProjectDataService,
	IProjectTemplatesService,
	ICreateProjectData,
	IProjectSettings,
	IProjectCreationSettings,
	ITemplateData,
	IProjectConfigService,
} from "../definitions/project";
import {
	INodePackageManager,
	IProjectNameService,
	IStaticConfig,
} from "../declarations";
import {
	IHooksService,
	IErrors,
	IFileSystem,
	IProjectHelper,
	IStringDictionary,
} from "../common/declarations";
import * as _ from "lodash";
import * as shelljs from "shelljs";
import { injector } from "../common/yok";

export class ProjectService implements IProjectService {
	constructor(
		private $hooksService: IHooksService,
		private $packageManager: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $pacoteService: IPacoteService,
		private $projectDataService: IProjectDataService,
		private $projectConfigService: IProjectConfigService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $tempService: ITempService,
		private $staticConfig: IStaticConfig
	) {}

	public async validateProjectName(opts: {
		projectName: string;
		force: boolean;
		pathToProject: string;
	}): Promise<string> {
		let projectName = opts.projectName;
		if (!projectName) {
			this.$errors.failWithHelp(
				"You must specify <App name> when creating a new project."
			);
		}

		projectName = await this.$projectNameService.ensureValidName(projectName, {
			force: opts.force,
		});
		const projectDir = this.getValidProjectDir(opts.pathToProject, projectName);
		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		return projectName;
	}

	@exported("projectService")
	@performanceLog()
	public async createProject(
		projectOptions: IProjectSettings
	): Promise<ICreateProjectData> {
		const projectName = await this.validateProjectName({
			projectName: projectOptions.projectName,
			force: projectOptions.force,
			pathToProject: projectOptions.pathToProject,
		});
		const projectDir = this.getValidProjectDir(
			projectOptions.pathToProject,
			projectName
		);

		this.$fs.createDirectory(projectDir);

		const appId =
			projectOptions.appId ||
			this.$projectHelper.generateDefaultAppId(
				projectName,
				constants.DEFAULT_APP_IDENTIFIER_PREFIX
			);
		this.$logger.trace(
			`Creating a new NativeScript project with name ${projectName} and id ${appId} at location ${projectDir}`
		);

		const projectCreationData = await this.createProjectCore({
			template: projectOptions.template,
			projectDir,
			ignoreScripts: projectOptions.ignoreScripts,
			appId: appId,
			projectName,
		});

		shelljs.exec(`git init ${projectDir}`);
		shelljs.exec(`git -C ${projectDir} add --all`);
		shelljs.exec(`git -C ${projectDir} commit -m "Initialize new project"`);

		this.$logger.info();
		this.$logger.printMarkdown(
			"__Project `%s` was successfully created.__",
			projectName
		);

		return projectCreationData;
	}

	@exported("projectService")
	public isValidNativeScriptProject(pathToProject?: string): boolean {
		try {
			const projectData = this.$projectDataService.getProjectData(
				pathToProject
			);

			return (
				!!projectData &&
				!!projectData.projectDir &&
				!!(
					projectData.projectIdentifiers.ios &&
					projectData.projectIdentifiers.android
				)
			);
		} catch (e) {
			return false;
		}
	}

	private getValidProjectDir(
		pathToProject: string,
		projectName: string
	): string {
		const selectedPath = path.resolve(pathToProject || ".");
		const projectDir = path.join(selectedPath, projectName);

		return projectDir;
	}

	private async createProjectCore(
		projectCreationSettings: IProjectCreationSettings
	): Promise<ICreateProjectData> {
		const {
			template,
			projectDir,
			appId,
			projectName,
			ignoreScripts,
		} = projectCreationSettings;

		try {
			const templateData = await this.$projectTemplatesService.prepareTemplate(
				template,
				projectDir
			);

			await this.extractTemplate(projectDir, templateData);

			this.alterPackageJsonData(projectDir, appId);
			this.$projectConfigService.writeDefaultConfig(projectDir, appId);

			await this.ensureAppResourcesExist(projectDir);

			// Install devDependencies and execute all scripts:
			await this.$packageManager.install(projectDir, projectDir, {
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts,
			});
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		await this.$hooksService.executeAfterHooks(Hooks.createProject, {
			hookArgs: projectCreationSettings,
		});

		return { projectName, projectDir };
	}

	@performanceLog()
	private async extractTemplate(
		projectDir: string,
		templateData: ITemplateData
	): Promise<void> {
		this.$fs.ensureDirectoryExists(projectDir);

		const fullTemplateName = templateData.version
			? `${templateData.templateName}@${templateData.version}`
			: templateData.templateName;
		await this.$pacoteService.extractPackage(fullTemplateName, projectDir);
	}

	@performanceLog()
	private async ensureAppResourcesExist(projectDir: string): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const appResourcesDestinationPath = projectData.getAppResourcesDirectoryPath(
			projectDir
		);

		if (!this.$fs.exists(appResourcesDestinationPath)) {
			this.$fs.createDirectory(appResourcesDestinationPath);
			const tempDir = await this.$tempService.mkdirSync("ns-default-template");
			// the template installed doesn't have App_Resources -> get from a default template
			await this.$pacoteService.extractPackage(
				constants.RESERVED_TEMPLATE_NAMES["default"],
				tempDir
			);
			const templateProjectData = this.$projectDataService.getProjectData(
				tempDir
			);
			const templateAppResourcesDir = templateProjectData.getAppResourcesDirectoryPath(
				tempDir
			);
			this.$fs.copyFile(
				path.join(templateAppResourcesDir, "*"),
				appResourcesDestinationPath
			);
		}
	}

	@performanceLog()
	private alterPackageJsonData(projectDir: string, appId: string): void {
		const projectFilePath = path.join(
			projectDir,
			this.$staticConfig.PROJECT_FILE_NAME
		);

		let packageJsonData = this.$fs.readJson(projectFilePath);

		packageJsonData = {
			...packageJsonData,
			...this.packageJsonDefaultData,
		};

		this.$fs.writeJson(projectFilePath, packageJsonData);
	}

	private get packageJsonDefaultData(): IStringDictionary {
		return {
			private: "true",
			description: "NativeScript Application",
			license: "SEE LICENSE IN <your-license-filename>",
			readme: "NativeScript Application",
			repository: "<fill-your-repository-here>",
		};
	}
}
injector.register("projectService", ProjectService);
