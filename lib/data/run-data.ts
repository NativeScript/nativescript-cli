export class RunData {
	constructor(public projectDir: string,
		public liveSyncInfo: ILiveSyncInfo,
		public deviceDescriptors: ILiveSyncDeviceInfo[]) { }
}
