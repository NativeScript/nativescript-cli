import * as xcode from "nativescript-dev-xcode";

declare global {
	type IXcode = typeof xcode;
	export namespace IXcode {
		export type project = typeof xcode.project;
		export interface Options extends xcode.Options {} // tslint:disable-line
	}
}

export { xcode };

$injector.register("xcode", xcode);
