///<reference path=".d.ts"/>
"use strict";

export class PlatformsData implements IPlatformsData {
	private platformsData : { [index: string]: any } = {};

	constructor($androidProjectService: IPlatformProjectService,
		$iOSProjectService: IPlatformProjectService) {

		this.platformsData = {
			ios: $iOSProjectService.platformData,
			android: $androidProjectService.platformData
		}
	}

	public get platformsNames() {
		return Object.keys(this.platformsData);
	}

	public getPlatformData(platform: string): IPlatformData {
		return this.platformsData[platform];
	}

	public get availablePlatforms(): any {
		return {
			iOS: "ios",
			Android: "android"
		};
	}
}
$injector.register("platformsData", PlatformsData);