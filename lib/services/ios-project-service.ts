///<reference path="../.d.ts"/>

class IOSProjectService implements  IPlatformProjectService {
	public validate(): IFuture<void> {
		return (() => {
		}).future<void>()();
	}

	public interpolateData(): void {

	}

	public afterCreateProject(): void {

	}

	public createProject(): IFuture<void> {
		return (() => {

		}).future<void>()();
	}

	public prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void> {
		return (() => {

		}).future<void>()();
	}

	public buildProject(): IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.register("iOSProjectService", IOSProjectService);