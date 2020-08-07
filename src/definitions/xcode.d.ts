/// <reference path="./nativescript-dev-xcode.d.ts" />

import * as xcode from "nativescript-dev-xcode";

declare global {
	type IXcode = typeof xcode;
	export namespace IXcode {
		export type target = xcode.target;
		export type project = xcode.project;
		export interface Options extends xcode.Options {} // tslint:disable-line
	}
}
