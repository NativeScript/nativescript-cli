import { hook } from "../common/helpers";
import { performanceLog } from "./../common/decorators";
import { EventEmitter } from "events";

export class PlatformJSService extends EventEmitter implements IPreparePlatformService {

	constructor(
		private $projectDataService: IProjectDataService,
		// private $webpackCompilerService: IWebpackCompilerService
	) { super(); }

	public async addPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const frameworkPackageNameData = { version: frameworkVersion };
		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);
	}

	@performanceLog()
	@hook('prepareJSApp')
	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: IPreparePlatformData): Promise<boolean> {
		// intentionally left blank, keep the support for before-prepareJSApp and after-prepareJSApp hooks
		return true;
	}
}

$injector.register("platformJSService", PlatformJSService);
