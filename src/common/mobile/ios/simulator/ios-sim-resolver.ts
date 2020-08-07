import * as path from "path";

export class IOSSimResolver implements Mobile.IiOSSimResolver {
	private static iOSSimName = "ios-sim-portable";
	private static iOSStandaloneExecutableName = "ios-sim-standalone.js";

	private _iOSSim: any = null;
	public get iOSSim(): any {
		if (!this._iOSSim) {
			this._iOSSim = require(IOSSimResolver.iOSSimName);
		}

		return this._iOSSim;
	}

	public get iOSSimPath(): string {
		return path.join(require.resolve(IOSSimResolver.iOSSimName), "..", IOSSimResolver.iOSStandaloneExecutableName);
	}
}

$injector.register("iOSSimResolver", IOSSimResolver);
