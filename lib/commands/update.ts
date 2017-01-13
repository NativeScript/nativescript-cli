import * as path from "path";
import * as shelljs from "shelljs";

export class UpdateCommand implements ICommand {
	constructor(
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let folders = [ "lib", "hooks", "platforms", "node_modules" ];
			let tmpDir = path.join(this.$projectData.projectDir, ".tmp_backup");

			try {
				shelljs.rm("-fr", tmpDir);
				shelljs.mkdir(tmpDir);
				shelljs.cp(path.join(this.$projectData.projectDir, "package.json"), tmpDir);
				for (let folder of folders) {
					let folderToCopy = path.join(this.$projectData.projectDir, folder);
					if (this.$fs.exists(folderToCopy)) {
						shelljs.cp("-rf", folderToCopy, tmpDir);
					}
				}
			} catch(error) {
				this.$logger.error("Could not backup project folders!");
				return;
			}

			try {
				this.executeCore(args, folders).wait();
			} catch (error) {
				shelljs.cp("-f", path.join(tmpDir, "package.json"), this.$projectData.projectDir);
				for (let folder of folders) {
					shelljs.rm("-rf", path.join(this.$projectData.projectDir, folder));
					let folderToCopy = path.join(tmpDir, folder);
					if (this.$fs.exists(folderToCopy)) {
						shelljs.cp("-fr", folderToCopy, this.$projectData.projectDir);
					}
				}
				this.$logger.error("Could not update the project!");
			} finally {
				shelljs.rm("-fr", tmpDir);
			}

		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return args.length < 2 && this.$projectData.projectDir !== "";
		}).future<boolean>()();
	}

	private executeCore(args: string[], folders: string[]): IFuture<void> {
		return (() => {
			let platforms = this.$platformService.getInstalledPlatforms();
			let availablePlatforms = this.$platformService.getAvailablePlatforms();
			let packagePlatforms: string[] = [];

			this.$projectDataService.initialize(this.$projectData.projectDir);
			for (let platform of availablePlatforms) {
				let platformData = this.$platformsData.getPlatformData(platform);
				let platformVersion = this.$projectDataService.getValue(platformData.frameworkPackageName);
				if (platformVersion) {
					packagePlatforms.push(platform);
					this.$projectDataService.removeProperty(platformData.frameworkPackageName);
				}
			}

			this.$platformService.removePlatforms(platforms);
			this.$pluginsService.remove("tns-core-modules").wait();
			this.$pluginsService.remove("tns-core-modules-widgets").wait();

			for (let folder of folders) {
				shelljs.rm("-fr", folder);
			}

			platforms = platforms.concat(packagePlatforms);
			if (args.length === 1) {
				for (let platform of platforms) {
					this.$platformService.addPlatforms([ platform+"@"+args[0] ]).wait();
				}
				this.$pluginsService.add("tns-core-modules@" + args[0]).wait();
			} else {
				this.$platformService.addPlatforms(platforms).wait();
				this.$pluginsService.add("tns-core-modules").wait();
			}
			this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("update", UpdateCommand);
