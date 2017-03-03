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
		return this.platformsData[platform.toLowerCase()].getPlatformData(projectData);
	}

	public get availablePlatforms(): any {
		return {
			iOS: "ios",
			Android: "android"
		};
	}
}
$injector.register("platformsData", PlatformsData);
