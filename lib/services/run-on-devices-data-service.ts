export class RunOnDevicesDataService {
	private liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	public getData(projectDir: string): ILiveSyncProcessInfo {
		return this.liveSyncProcessesInfo[projectDir];
	}

	public getAllData(): IDictionary<ILiveSyncProcessInfo> {
		return this.liveSyncProcessesInfo;
	}

	public getDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
		const liveSyncProcessesInfo = this.liveSyncProcessesInfo[projectDir] || <ILiveSyncProcessInfo>{};
		const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
		return currentDescriptors || [];
	}

	public hasDeviceDescriptors(projectDir: string) {
		return this.liveSyncProcessesInfo[projectDir].deviceDescriptors.length;
	}

	public persistData(projectDir: string, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): void {
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
		this.liveSyncProcessesInfo[projectDir].isStopped = false;
		this.liveSyncProcessesInfo[projectDir].syncToPreviewApp = liveSyncInfo.syncToPreviewApp;

		const currentDeviceDescriptors = this.getDeviceDescriptors(projectDir);
		this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), "identifier");
	}
}
$injector.register("runOnDevicesDataService", RunOnDevicesDataService);
