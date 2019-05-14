export class RunOnDevicesDataService {
	// TODO: Rename liveSyncProcessesInfo
	private liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	public getDataForProject(projectDir: string): ILiveSyncProcessInfo {
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

	public hasDeviceDescriptors(projectDir: string): boolean {
		return !!this.liveSyncProcessesInfo[projectDir].deviceDescriptors.length;
	}

	public persistData(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], platforms: string[]): void {
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
		this.liveSyncProcessesInfo[projectDir].isStopped = false;
		this.liveSyncProcessesInfo[projectDir].platforms = platforms;

		const currentDeviceDescriptors = this.getDeviceDescriptors(projectDir);
		this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), "identifier");
	}
}
$injector.register("runOnDevicesDataService", RunOnDevicesDataService);
