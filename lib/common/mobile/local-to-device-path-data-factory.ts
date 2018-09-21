import * as helpers from "../helpers";
import * as path from "path";

class LocalToDevicePathData implements Mobile.ILocalToDevicePathData {
	private devicePath: string;
	private relativeToProjectBasePath: string;

	constructor(private filePath: string,
		private localProjectRootPath: string,
		private onDeviceFileName: string,
		public deviceProjectRootPath: string) { }

	public getLocalPath(): string {
		return this.filePath;
	}

	public getDevicePath(): string {
		if (!this.devicePath) {
			const devicePath = path.join(this.deviceProjectRootPath, path.dirname(this.getRelativeToProjectBasePath()), this.onDeviceFileName);
			this.devicePath = helpers.fromWindowsRelativePathToUnix(devicePath);
		}

		return this.devicePath;
	}

	public getRelativeToProjectBasePath(): string {
		if (!this.relativeToProjectBasePath) {
			this.relativeToProjectBasePath = path.relative(this.localProjectRootPath, this.filePath);
		}

		return this.relativeToProjectBasePath;
	}
}

export class LocalToDevicePathDataFactory implements Mobile.ILocalToDevicePathDataFactory {
	create(filePath: string, localProjectRootPath: string, onDeviceFileName: string, deviceProjectRootPath: string): Mobile.ILocalToDevicePathData {
		return new LocalToDevicePathData(filePath, localProjectRootPath, onDeviceFileName, deviceProjectRootPath);
	}
}
$injector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
