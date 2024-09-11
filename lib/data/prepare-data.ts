import { IOptions } from "../declarations";
import { ControllerDataBase } from "./controller-data-base";
import * as _ from "lodash";

export class PrepareData extends ControllerDataBase {
	public release: boolean;
	public hmr: boolean;
	public env: any;
	public watch?: boolean;
	public watchNative: boolean = true;
	public hostProjectPath?: string;

	constructor(
		public projectDir: string,
		public platform: string,
		data: IOptions
	) {
		super(projectDir, platform, data);

		const env: any = {};

		if (Array.isArray(data.env)) {
			data.env.forEach((flag: string | object) => {
				if (typeof flag === "string") {
					env.env = flag;
					return;
				}

				Object.assign(env, flag);
			});
		} else {
			Object.assign(env, data.env);
		}

		this.release = data.release;
		this.hmr = data.hmr || data.useHotModuleReload;
		this.env = {
			...env,
			hmr: data.hmr || data.useHotModuleReload,
		};
		this.watch = data.watch;
		if (_.isBoolean(data.watchNative)) {
			this.watchNative = data.watchNative;
		}
		this.hostProjectPath = data.hostProjectPath;
	}
}

export class IOSPrepareData extends PrepareData {
	public teamId: string;
	public provision: string;
	public mobileProvisionData: any;

	constructor(projectDir: string, platform: string, data: IOptions) {
		super(projectDir, platform, data);

		this.teamId = data.teamId;
		this.provision = data.provision;
		this.mobileProvisionData = data.mobileProvisionData;
	}
}

export class AndroidPrepareData extends PrepareData {}
