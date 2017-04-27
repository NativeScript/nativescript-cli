import * as xcode from "xcode";

declare global {
	type IXcode = typeof xcode;
	export namespace IXcode {
		export type project = typeof xcode.project;
		export interface Options extends xcode.Options {} // tslint:disable-line
	}
}

$injector.register("xcode", xcode);
