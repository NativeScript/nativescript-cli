import * as path from "path";
import * as shelljs from "shelljs";

export class UpdateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $fs: IFileSystem,
		private $logger: ILogger) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		let folders = ["lib", "hooks", "platforms", "node_modules"];
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
		let platforms = this.$platformService.getInstalledPlatforms(this.$projectData);
		let availablePlatforms = this.$platformService.getAvailablePlatforms(this.$projectData);
		let packagePlatforms: string[] = [];

		for (let platform of availablePlatforms) {
			let platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const platformVersion = this.$projectDataService.getNSValue(this.$projectData.projectDir, platformData.frameworkPackageName);
			if (platformVersion) {
				packagePlatforms.push(platform);
				this.$projectDataService.removeNSProperty(this.$projectData.projectDir, platformData.frameworkPackageName);
			}
		}

		await this.$platformService.removePlatforms(platforms, this.$projectData);
		await this.$pluginsService.remove("tns-core-modules", this.$projectData);
		await this.$pluginsService.remove("tns-core-modules-widgets", this.$projectData);

		for (let folder of folders) {
			shelljs.rm("-fr", folder);
		}

		platforms = platforms.concat(packagePlatforms);
		if (args.length === 1) {
			for (let platform of platforms) {
				await this.$platformService.addPlatforms([platform + "@" + args[0]], this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
			}

			await this.$pluginsService.add("tns-core-modules@" + args[0], this.$projectData);
		} else {
			await this.$platformService.addPlatforms(platforms, this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
			await this.$pluginsService.add("tns-core-modules", this.$projectData);
		}

		await this.$pluginsService.ensureAllDependenciesAreInstalled(this.$projectData);
	}
}

$injector.registerCommand("update", UpdateCommand);
