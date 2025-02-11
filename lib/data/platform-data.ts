import { ControllerDataBase } from "./controller-data-base";

export class AddPlatformData extends ControllerDataBase {
	public frameworkPath?: string;

	constructor(
		public projectDir: string,
		public platform: string,
		data: any
	) {
		super(projectDir, platform, data);

		this.frameworkPath = data.frameworkPath;
	}
}
