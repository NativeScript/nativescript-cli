export class PlatformsData implements IPlatformsData {
	private platformsData: { [index: string]: any } = {};

	constructor($androidProjectService: IPlatformProjectService,
		$iOSProjectService: IPlatformProjectService) {

		this.platformsData = {
			ios: $iOSProjectService,
			android: $androidProjectService
		};
	}

	public get platformsNames() {
		return Object.keys(this.platformsData);
	}

	public getPlatformData(platform: string, projectData: IProjectData): IPlatformData {
		const platformKey = platform && _.first(platform.toLowerCase().split("@"));
		let platformData: IPlatformData;
		if (platformKey) {
			platformData = this.platformsData[platformKey] && this.platformsData[platformKey].getPlatformData(projectData);
		}

		return platformData;
	}

	public get availablePlatforms(): any {
		return {
			iOS: "ios",
			Android: "android"
		};
	}
}
$injector.register("platformsData", PlatformsData);
