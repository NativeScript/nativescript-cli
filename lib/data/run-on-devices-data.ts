export class RunOnDevicesData {
	constructor(public projectDir: string, public liveSyncInfo: ILiveSyncInfo, public deviceDescriptors: ILiveSyncDeviceInfo[]) { }
}
