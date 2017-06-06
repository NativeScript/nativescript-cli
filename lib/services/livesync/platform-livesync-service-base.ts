export class PlatformLiveSyncServiceBase {
	constructor(
		private $devicePathProvider: Mobile.IDevicePathProvider,
	) {
	}

	protected async getAppData(syncInfo: IFullSyncInfo): Promise<Mobile.IDeviceAppData> {
		const deviceProjectRootOptions: Mobile.IDeviceProjectRootOptions = _.assign({ appIdentifier: syncInfo.projectData.projectId }, syncInfo);
		return {
			appIdentifier: syncInfo.projectData.projectId,
			device: syncInfo.device,
			platform: syncInfo.device.deviceInfo.platform,
			getDeviceProjectRootPath: () => this.$devicePathProvider.getDeviceProjectRootPath(syncInfo.device, deviceProjectRootOptions),
			isLiveSyncSupported: async () => true
		};
	}
}
