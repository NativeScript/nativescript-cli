import * as temp from "temp";
import { hook } from "../common/helpers";
import { PreparePlatformService } from "./prepare-platform-service";
import { performanceLog } from "./../common/decorators";

temp.track();

export class PreparePlatformJSService extends PreparePlatformService implements IPreparePlatformService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		$hooksService: IHooksService,
		private $projectDataService: IProjectDataService) {
		super($fs, $hooksService, $xmlValidator);
	}

	public async addPlatform(info: IAddPlatformInfo): Promise<void> {
		const frameworkPackageNameData: any = { version: info.installedVersion };
		this.$projectDataService.setNSValue(info.projectData.projectDir, info.platformData.frameworkPackageName, frameworkPackageNameData);
	}

	@performanceLog()
	@hook('prepareJSApp')
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		// intentionally left blank, keep the support for before-prepareJSApp and after-prepareJSApp hooks
	}
}

$injector.register("preparePlatformJSService", PreparePlatformJSService);
