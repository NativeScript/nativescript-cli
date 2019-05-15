
export class PlatformsDataService implements IPlatformsDataService {
	private platformsDataService: { [index: string]: any } = {};

	constructor($androidProjectService: IPlatformProjectService,
		$iOSProjectService: IPlatformProjectService) {

		this.platformsDataService = {
			ios: $iOSProjectService,
			android: $androidProjectService
		};
	}

	public get platformsNames() {
		return Object.keys(this.platformsDataService);
	}

	public getPlatformData(platform: string, projectData: IProjectData): IPlatformData {
		const platformKey = platform && _.first(platform.toLowerCase().split("@"));
		let platformData: IPlatformData;
		if (platformKey) {
			platformData = this.platformsDataService[platformKey] && this.platformsDataService[platformKey].getPlatformData(projectData);
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
$injector.register("platformsDataService", PlatformsDataService);
