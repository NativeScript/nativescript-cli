import { DataBase } from "./data-base";

export class AddPlatformData extends DataBase {
	public frameworkPath?: string;

	constructor(public projectDir: string, public platform: string, data: any) {
		super(projectDir, platform, data);

		this.frameworkPath = data.frameworkPath;
	}
}
