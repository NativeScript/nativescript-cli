import * as constants from "../constants";
import * as path from "path";
import * as shelljs from "shelljs";
import { exported } from "../common/decorators";
import * as helpers from "../common/helpers";

export class ProjectService implements IProjectService {

	constructor(private $npm: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $staticConfig: IStaticConfig) { }

	@exported("projectService")
	public async createProject(projectOptions: IProjectSettings): Promise<void> {
		let projectName = projectOptions.projectName;
		const selectedTemplate = projectOptions.template || "default";
		const template = constants.RESERVED_TEMPLATE_NAMES[selectedTemplate] || selectedTemplate;

		if (!projectName) {
			this.$errors.fail("You must specify <App name> when creating a new project.");
		}

		projectName = await this.$projectNameService.ensureValidName(projectName, { force: projectOptions.force });

		const selectedPath = path.resolve(projectOptions.pathToProject || ".");
		const projectDir = path.join(selectedPath, projectName);

		this.$fs.createDirectory(projectDir);

		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		const projectId = projectOptions.appId || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);

		this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${projectId} at location ${projectDir}`);

		try {
			this.createPackageJson(projectDir, projectId);
			
			let templateInfo = await this.getTemplateInfoFromNpm(template);
			if(templateInfo) {
				templateInfo.dependencies[templateInfo.name] = templateInfo.version;
			} else {
				templateInfo = await this.installAndGetInfo(projectDir, template);
			}

			if (!(templateInfo.dependencies && templateInfo.dependencies[constants.TNS_CORE_MODULES_NAME])) {
				await this.$npm.install(constants.TNS_CORE_MODULES_NAME, projectDir, <any>{  silent: true, save: true });
			}

			this.addDependencies(projectDir, templateInfo.dependencies, templateInfo.devDependencies);

			await this.$npm.install(projectDir, projectDir, {
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: projectOptions.ignoreScripts
			});

			await this.extractTemplate(projectDir, path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, templateInfo.name));
			this.removeUnnecessaryPackageJsonKeys(projectDir);

			await this.ensureAppResourcesExist(projectDir);

			await this.$npm.uninstall(templateInfo.name, { save: true }, projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);
	}

	@exported("projectService")
	public isValidNativeScriptProject(pathToProject?: string): boolean {
		try {
			this.$projectData.initializeProjectData(pathToProject);
			return !!this.$projectData.projectDir && !!this.$projectData.projectId;
		} catch (e) {
			return false;
		}
	}

	private async extractTemplate(projectDir: string, realTemplatePath: string): Promise<void> {
		this.$fs.ensureDirectoryExists(projectDir);

		const appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
		this.$fs.createDirectory(appDestinationPath);

		this.$logger.trace(`Copying application from '${realTemplatePath}' into '${appDestinationPath}'.`);
		shelljs.cp('-R', path.join(realTemplatePath, "*"), appDestinationPath);

		this.$fs.deleteDirectory(path.join(appDestinationPath, constants.NODE_MODULES_FOLDER_NAME));

		this.$fs.createDirectory(path.join(projectDir, "platforms"));
	}

	private async ensureAppResourcesExist(projectDir: string): Promise<void> {
		const appPath = path.join(projectDir, constants.APP_FOLDER_NAME),
			appResourcesDestinationPath = path.join(appPath, constants.APP_RESOURCES_FOLDER_NAME);

		if (!this.$fs.exists(appResourcesDestinationPath)) {
			this.$fs.createDirectory(appResourcesDestinationPath);

			// the template installed doesn't have App_Resources -> get from a default template
			const defaultTemplateName = constants.RESERVED_TEMPLATE_NAMES["default"];
			await this.$npm.install(defaultTemplateName, projectDir, {
				save: true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: false
			});

			const defaultTemplateAppResourcesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME,
				defaultTemplateName, constants.APP_RESOURCES_FOLDER_NAME);

			if (this.$fs.exists(defaultTemplateAppResourcesPath)) {
				shelljs.cp('-R', defaultTemplateAppResourcesPath, appPath);
			}

			await this.$npm.uninstall(defaultTemplateName, { save: true }, projectDir);
		}
	}

	private async getTemplateInfoFromNpm(templateName: string) {
		if (helpers.isURL(templateName) || this.$fs.exists(templateName) || helpers.isTgz(templateName)) {
			return null;
		}

		return await this.$npm.view(templateName, {});
	}

	private removeUnnecessaryPackageJsonKeys(projectDir: string): void {
		const extractedTemplatePackageJsonPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.PACKAGE_JSON_FILE_NAME);
		if (this.$fs.exists(extractedTemplatePackageJsonPath)) {
			const templatePackageJsonData = this.$fs.readJson(extractedTemplatePackageJsonPath);
			for (const key in templatePackageJsonData) {
				if (constants.PackageJsonKeysToKeep.indexOf(key) === -1) {
					delete templatePackageJsonData[key];
				}
			}

			this.$logger.trace("Deleting unnecessary information from template json.");
			this.$fs.writeJson(extractedTemplatePackageJsonPath, templatePackageJsonData);
		}
	}

	private createPackageJson(projectDir: string, projectId: string): void {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

		this.$fs.writeJson(projectFilePath, {
			"description": "NativeScript Application",
			"license": "SEE LICENSE IN <your-license-filename>",
			"readme": "NativeScript Application",
			"repository": "<fill-your-repository-here>"
		});

		this.$projectDataService.setNSValue(projectDir, "id", projectId);
	}

	private addDependencies(projectDir: string, dependencies: object, devDependencies: object) {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		const packageJson = this.$fs.readJson(projectFilePath);

		packageJson.dependencies = _.extend({}, packageJson.dependencies, dependencies) ;
		packageJson.devDependencies = _.extend({}, packageJson.devDependencies, devDependencies);

		this.$fs.writeJson(projectFilePath, packageJson);
	}

	private async installAndGetInfo(projectDir: string, template: string) {
		const result = await this.$npm.install(template, projectDir, <any>{  silent: true, save: true });
		const packageJsonPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, result.name, constants.PACKAGE_JSON_FILE_NAME);
		return this.$fs.readJson(packageJsonPath);
	}
}
$injector.register("projectService", ProjectService);
