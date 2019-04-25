import { hook } from "../common/helpers";
import { performanceLog } from "./../common/decorators";
import { EventEmitter } from "events";

export class PreparePlatformJSService extends EventEmitter implements IPreparePlatformService {

	constructor(
		private $webpackCompilerService: IWebpackCompilerService
	) {
		super();
	}

	@performanceLog()
	@hook('prepareJSApp')
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		// intentionally left blank, keep the support for before-prepareJSApp and after-prepareJSApp hooks
	}

	public async startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IPreparePlatformJSInfo): Promise<void> {
		this.$webpackCompilerService.on("webpackEmittedFiles", files => {
			this.emit("jsFilesChanged", files);
		});

		await this.$webpackCompilerService.startWatcher(platformData, projectData, <any>config);
	}
}

$injector.register("preparePlatformJSService", PreparePlatformJSService);
