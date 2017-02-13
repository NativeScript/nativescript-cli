import * as path from "path";
import * as shelljs from "shelljs";
import * as constants from "../constants";

export class UpdateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $fs: IFileSystem,
		private $logger: ILogger) { }

	public async execute(args: string[]): Promise<void> {
		let folders = ["hooks", "platforms", "node_modules"];
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
		} catch (error) {
			this.$logger.error("Could not backup project folders!");
			return;
		}

		try {
			await this.executeCore(args, folders);
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
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return args.length < 2 && this.$projectData.projectDir !== "";
	}

	private async executeCore(args: string[], folders: string[]): Promise<void> {
		let platforms = this.$platformService.getInstalledPlatforms();
		let availablePlatforms = this.$platformService.getAvailablePlatforms();
		let packagePlatforms: string[] = [];

		this.$projectDataService.initialize(this.$projectData.projectDir);
		for (let platform of availablePlatforms) {
			let platformData = this.$platformsData.getPlatformData(platform);
			let platformVersion = this.$projectDataService.getValue(platformData.frameworkPackageName, constants.DEV_DEPENDENCIES);
			if (platformVersion) {
				packagePlatforms.push(platform);
				this.$projectDataService.removeProperty(platformData.frameworkPackageName);
			}
		}

		this.$platformService.removePlatforms(platforms);
		await this.$pluginsService.remove("tns-core-modules");
		await this.$pluginsService.remove("tns-core-modules-widgets");

		for (let folder of folders) {
			shelljs.rm("-fr", folder);
		}

		platforms = platforms.concat(packagePlatforms);
		if (args.length === 1) {
			for (let platform of platforms) {
				await this.$platformService.addPlatforms([platform + "@" + args[0]]);
			}

			await this.$pluginsService.add("tns-core-modules@" + args[0]);
		} else {
			await this.$platformService.addPlatforms(platforms);
			await this.$pluginsService.add("tns-core-modules");
		}

		await this.$pluginsService.ensureAllDependenciesAreInstalled();
	}
}

$injector.registerCommand("update", UpdateCommand);
