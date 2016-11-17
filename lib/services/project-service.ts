import * as constants from "../constants";
import * as osenv from "osenv";
import * as path from "path";
import * as shelljs from "shelljs";

export class ProjectService implements IProjectService {

	constructor(private $npm: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $options: IOptions) { }

	public createProject(projectName: string, selectedTemplate?: string): IFuture<void> {
		return(() => {
			if (!projectName) {
				this.$errors.fail("You must specify <App name> when creating a new project.");
			}

			projectName = this.$projectNameService.ensureValidName(projectName, {force: this.$options.force}).wait();

			let projectId = this.$options.appid || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);

			let projectDir = path.join(path.resolve(this.$options.path || "."), projectName);
			this.$fs.createDirectory(projectDir).wait();

			let customAppPath = this.getCustomAppPath();
			if(customAppPath) {
				customAppPath = path.resolve(customAppPath);
				if(!this.$fs.exists(customAppPath).wait()) {
					this.$errors.failWithoutHelp(`The specified path "${customAppPath}" doesn't exist. Check that you specified the path correctly and try again.`);
				}

				let customAppContents = this.$fs.enumerateFilesInDirectorySync(customAppPath);
				if(customAppContents.length === 0) {
					this.$errors.failWithoutHelp(`The specified path "${customAppPath}" is empty directory.`);
				}
			}

			if(this.$fs.exists(projectDir).wait() && !this.$fs.isEmptyDir(projectDir).wait()) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			this.$logger.trace("Creating a new NativeScript project with name %s and id %s at location %s", projectName, projectId, projectDir);

			let appDirectory = path.join(projectDir, constants.APP_FOLDER_NAME);
			let appPath: string = null;
			if (customAppPath) {
				this.$logger.trace("Using custom app from %s", customAppPath);

				// Make sure that the source app/ is not a direct ancestor of a target app/
				let relativePathFromSourceToTarget = path.relative(customAppPath, appDirectory);
				// path.relative returns second argument if the paths are located on different disks
				// so in this case we don't need to make the check for direct ancestor
				if (relativePathFromSourceToTarget !== appDirectory) {
					let doesRelativePathGoUpAtLeastOneDir = relativePathFromSourceToTarget.split(path.sep)[0] === "..";
					if (!doesRelativePathGoUpAtLeastOneDir) {
						this.$errors.fail("Project dir %s must not be created at/inside the template used to create the project %s.", projectDir, customAppPath);
					}
				}
				this.$logger.trace("Copying custom app into %s", appDirectory);
				appPath = customAppPath;
			} else {
				let defaultTemplatePath = this.$projectTemplatesService.prepareTemplate(selectedTemplate).wait();
				this.$logger.trace(`Copying application from '${defaultTemplatePath}' into '${appDirectory}'.`);
				appPath = defaultTemplatePath;
			}

			try {
				this.createProjectCore(projectDir, appPath, projectId).wait();
				//update dependencies and devDependencies of newly created project with data from template
				this.mergeProjectAndTemplateProperties(projectDir, appPath).wait();
				this.updateAppResourcesDir(appDirectory).wait();
				this.$npm.install(projectDir, projectDir, { "ignore-scripts": this.$options.ignoreScripts }).wait();
			} catch (err) {
				this.$fs.deleteDirectory(projectDir).wait();
				throw err;
			}
			this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);

		}).future<void>()();
	}

	private mergeProjectAndTemplateProperties(projectDir: string, templatePath: string): IFuture<void> {
		return (() => {
			let templatePackageJsonPath = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
			if(this.$fs.exists(templatePackageJsonPath).wait()) {
				let projectPackageJsonPath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
				let projectPackageJsonData = this.$fs.readJson(projectPackageJsonPath).wait();
				this.$logger.trace("Initial project package.json data: ", projectPackageJsonData);
				let templatePackageJsonData = this.$fs.readJson(templatePackageJsonPath).wait();
				if(projectPackageJsonData.dependencies || templatePackageJsonData.dependencies) {
					projectPackageJsonData.dependencies = this.mergeDependencies(projectPackageJsonData.dependencies, templatePackageJsonData.dependencies);
				}

				if(projectPackageJsonData.devDependencies || templatePackageJsonData.devDependencies) {
					projectPackageJsonData.devDependencies = this.mergeDependencies(projectPackageJsonData.devDependencies, templatePackageJsonData.devDependencies);
				}

				this.$logger.trace("New project package.json data: ", projectPackageJsonData);
				this.$fs.writeJson(projectPackageJsonPath, projectPackageJsonData).wait();
			} else {
				this.$logger.trace(`Template ${templatePath} does not have ${constants.PACKAGE_JSON_FILE_NAME} file.`);
			}
		}).future<void>()();
	}

	private updateAppResourcesDir(appDirectory: string): IFuture<void> {
		return (() => {
			let defaultAppResourcesDir = path.join(this.$projectTemplatesService.defaultTemplatePath.wait(), constants.APP_RESOURCES_FOLDER_NAME);
			let targetAppResourcesDir = path.join(appDirectory, constants.APP_RESOURCES_FOLDER_NAME);
			this.$logger.trace(`Updating AppResources values from ${defaultAppResourcesDir} to ${targetAppResourcesDir}`);
			shelljs.cp("-R", path.join(defaultAppResourcesDir, "*"), targetAppResourcesDir);
		}).future<void>()();
	}

	private mergeDependencies(projectDependencies: IStringDictionary, templateDependencies: IStringDictionary): IStringDictionary {
		// Cast to any when logging as logger thinks it can print only string.
		// Cannot use toString() because we want to print the whole objects, not [Object object]
		this.$logger.trace("Merging dependencies, projectDependencies are: ", <any>projectDependencies, " templateDependencies are: ", <any>templateDependencies);
		projectDependencies = projectDependencies || {};
		_.extend(projectDependencies, templateDependencies || {});
		let sortedDeps: IStringDictionary = {};
		let dependenciesNames = _.keys(projectDependencies).sort();
		_.each(dependenciesNames, (key: string) => {
			sortedDeps[key] = projectDependencies[key];
		});
		this.$logger.trace("Sorted merged dependencies are: ", <any>sortedDeps);
		return sortedDeps;
	}

	private createProjectCore(projectDir: string, appSourcePath: string, projectId: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(projectDir).wait();

			let appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
			this.$fs.createDirectory(appDestinationPath).wait();

			if(this.$options.symlink) {
				this.$fs.symlink(appSourcePath, appDestinationPath).wait();
			} else {
				shelljs.cp('-R', path.join(appSourcePath, "*"), appDestinationPath);
				// Copy hidden files.
				shelljs.cp('-R', path.join(appSourcePath, ".*"), appDestinationPath);
			}

			this.createBasicProjectStructure(projectDir,  projectId).wait();
		}).future<void>()();
	}

	private createBasicProjectStructure(projectDir: string,  projectId: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(path.join(projectDir, "platforms")).wait();

			this.$projectDataService.initialize(projectDir);
			this.$projectDataService.setValue("id", projectId).wait();

			let tnsModulesVersion = this.$options.tnsModulesVersion;
			let packageName = constants.TNS_CORE_MODULES_NAME;
			if (tnsModulesVersion) {
				packageName = `${packageName}@${tnsModulesVersion}`;
			}

			this.$npm.executeNpmCommand(`npm install ${packageName} --save --save-exact`, projectDir).wait();
		}).future<void>()();
	}

	private getCustomAppPath(): string {
		let customAppPath = this.$options.copyFrom || this.$options.linkTo;
		if(customAppPath) {
			if(customAppPath.indexOf("http://") === 0) {
				this.$errors.fail("Only local paths for custom app are supported.");
			}

			if(customAppPath.substr(0, 1) === '~') {
				customAppPath = path.join(osenv.home(), customAppPath.substr(1));
			}
		}

		return customAppPath;
	}
}
$injector.register("projectService", ProjectService);
