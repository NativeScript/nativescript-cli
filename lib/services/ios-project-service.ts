///<reference path="../.d.ts"/>

class IOSProjectService implements  IPlatformSpecificProjectService {
	public validate(): IFuture<void> {
		return (() => {
		}).future<void>()();
	}

	public interpolateData(): void {

	}

	public executePlatformSpecificAction(): void {

	}

	public createProject(): IFuture<void> {
		return (() => {

		}).future<any>()();
	}

	public buildProject(): IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.register("iOSProjectService", IOSProjectService);