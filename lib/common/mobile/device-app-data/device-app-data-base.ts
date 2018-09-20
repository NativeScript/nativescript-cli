import * as helpers from "../../helpers";

export class DeviceAppDataBase {
	constructor(protected _appIdentifier: string) { }

	public get appIdentifier(): string {
		return this._appIdentifier;
	}

	protected _getDeviceProjectRootPath(projectRoot: string): string {
		return helpers.fromWindowsRelativePathToUnix(projectRoot);
	}
}
