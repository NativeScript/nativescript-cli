import * as path from "path";

const buildInfoFileName = ".nsbuildinfo";

export class BuildInfoFileService {
	constructor(
		private $fs: IFileSystem,
		private $projectChangesService: IProjectChangesService
	) { }

	public saveBuildInfoFile(platformData: IPlatformData, buildInfoFileDirname: string): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		const buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public getBuildInfoFromFile(platformData: IPlatformData, buildOutputOptions: IBuildOutputOptions, buildOutputPath?: string): IBuildInfo {
		buildOutputPath = buildOutputPath || platformData.getBuildOutputPath(buildOutputOptions);
		const buildInfoFile = path.join(buildOutputPath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				const buildInfo = this.$fs.readJson(buildInfoFile);
				return buildInfo;
			} catch (e) {
				return null;
			}
		}

		return null;
	}
}
$injector.register("buildInfoFileService", BuildInfoFileService);
